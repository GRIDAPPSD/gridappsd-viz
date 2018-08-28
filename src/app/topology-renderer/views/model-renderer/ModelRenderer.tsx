import * as React from 'react';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { zoom, zoomIdentity } from 'd3-zoom';
import { select, event as currentEvent, Selection } from 'd3-selection';

import { Wait } from '../../../shared/views/wait/Wait';

import './ModelRenderer.scss';
import { Tooltip } from '../../../shared/views/tooltip/Tooltip';

interface Props {
  topology: { nodes: any[], links: any[] };
  showWait: boolean;
  topologyName: string;
}

interface State {
}

export class ModelRenderer extends React.Component<Props, State> {

  private _canvas: Selection<SVGSVGElement, any, any, any> = null;
  private _container: Selection<SVGGElement, any, any, any> = null;
  private _svg: SVGSVGElement = null;
  private readonly _zoomConfigs = {
    ieee8500: { x: 55.164249877758266, y: -139.96588467618716, k: 0.02029557042757985 },
    ieee123: { x: 198.39621983106292, y: 25.86191550179683, k: 0.1024394509185199 }
  }

  private readonly _zoomer = zoom();

  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    this._canvas = select<SVGSVGElement, any>(this._svg);
    this._container = this._canvas.select<SVGGElement>('g');
    this._zoomer.on('zoom', () => {
      this._container.attr('transform', currentEvent.transform);
    });
    this._addTooltipTrigger();
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props.topology !== newProps.topology)
      this._render(newProps.topology);
  }

  render() {
    return (
      <div className='model-renderer'>
        <svg ref={elem => this._svg = elem} className={this.props.topologyName}>
          <g>
          </g>
        </svg>
        <Wait show={this.props.showWait} />
      </div>
    );
  }
  private _getChildName(child) {
    return '_' + child.name.replace(/(\D+)(\d)(a|b|c)$/, (match, p1, p2, p3) => [p1, p2].join(''));
  }

  private _render(model: { nodes: any[]; links: any[] }) {
    const elementData = model.nodes;
    console.log(model);

    const xExtent = extent(elementData, (d: any) => d.x);
    const yExtent = extent(elementData, (d: any) => d.y);
    const xOffset = -xExtent[0];
    const yOffset = -yExtent[0];
    const zoomCenter = this._zoomConfigs[this.props.topologyName];
    this._container.selectAll('g').remove();

    this._canvas.call(this._zoomer)
      .call(this._zoomer.transform, zoomIdentity.translate(zoomCenter.x, zoomCenter.y).scale(zoomCenter.k));

    this._container.attr('transform', `translate(${zoomCenter.x},${zoomCenter.y}) scale(${zoomCenter.k})`);

    this._renderNodes(model.nodes, xOffset, yOffset);
    this._renderEdges(model.links, xOffset, yOffset);

  }

  private _renderEdges(edgeData: any[], xOffset, yOffset) {
    const edges = this._container.append('g')
      .attr('class', 'edges');
    // A line function for the links
    const lineGenerator: any = line()
      .x((d: any) => d.element.x + xOffset)
      .y((d: any) => d.element.y + yOffset)

    edges.selectAll('path.edge')
      .data(edgeData)
      .enter()
      .append('path')
      .filter(link => [link.from.x, link.from.y, link.to.x, link.to.y].every(e => e !== undefined))
      .datum(link => [{ link, element: link.from }, { link, element: link.to }])
      .attr('class', (d: any) => 'link ' + d[0].link.name)
      .attr('stroke', (d: any) => {
        switch (d[0].link.data.phases) {
          case 'A':
            return 'blue';
          case 'B':
            return 'orange';
          case 'C':
            return 'green';
          case 'ABC':
            return 'black';
          default:
            return 'darkgray';
        }
      })
      .attr('d', lineGenerator);
  }

  private _renderNodes(nodeData: any[], xOffset, yOffset) {
    const nodes = this._container.append('g')
      .attr('class', 'nodes');

    nodes.selectAll('circle.node')
      .data(nodeData)
      .enter()
      .append('circle')
      .filter(element => element.x !== undefined && element.y !== undefined)
      .each(element => {
        element.rendering_x = element.x + xOffset;
        element.rendering_y = element.y + yOffset;

        // Add an underscore to guard against names that contain only numbers which
        // will make d3 complain because they are not valid selectors
        let className = 'element _' + element.name + ' ' + element.type;
        let isCapacitor = false;
        let isRegulator = false;
        let imageName = '';
        element.children.forEach(child => {
          className += ' ' + this._getChildName(child);

          if (child.type == 'capacitor')
            isCapacitor = true;
          if (child.type == 'regulator')
            isRegulator = true;
        });

        if (isCapacitor) {
          className += ' capacitor';
          imageName = './images/capacitor-condenser.png';
        }

        if (isRegulator) {
          imageName = './images/regulator.png';
          className += ' regulator';
        }
        element.rendering_baseClass = className;

        if (isCapacitor || isRegulator)
          this._container.append('image')
            .attr('xlink:href', imageName)
            .attr('width', 300)
            .attr('height', 300)
            .attr('x', element.rendering_x)
            .attr('y', element.rendering_y);
      })
      .filter(element => element.children.length === 0)
      .attr('class', element => element.rendering_baseClass + ' node')
      .attr('cx', element => element.rendering_x)
      .attr('cy', element => element.rendering_y)
      .attr('r', element => {
        // If the element has a capacitor child, 
        // color it differently
        if (element.children.length === 0)
          return 50;
        else if (element.children[0].type === 'capacitor' || element.children[0].type === 'regulator')
          return 150;
        return 50;
      });
  }

  private _addTooltipTrigger() {
    let tooltip: Tooltip = null;

    this._canvas.on('mouseover', () => {
      const target = select(currentEvent.target);
      if (target.classed('node')) {
        let content = '';
        const datum = target.datum() as any;
        if (datum.children.length == 0)
          content = 'Node: ' + datum.name + ' (' + datum.x + ',' + datum.y + ')';
        else if (datum.children[0].type == 'capacitor')
          content = 'Capacitor: ' + this._getChildName(datum.children[0]);
        else if (datum.children[0].type == 'regulator')
          content = 'Regulator: ' + datum.children[0].name;
        tooltip = new Tooltip({ position: 'bottom', content });
        tooltip.showAt(currentEvent.target);
      }
    }).on('mouseout', () => {
      if (tooltip) {
        tooltip.hide();
        tooltip = null;
      }
    });
  }

}