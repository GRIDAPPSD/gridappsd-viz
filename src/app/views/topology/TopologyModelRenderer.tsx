import * as React from 'react';
import { Button, Glyphicon } from 'react-bootstrap';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { zoom, zoomIdentity } from 'd3-zoom';
import { select, event as currentEvent, Selection } from 'd3-selection';
import { Wait } from '../wait/Wait';
import { LabelContainer } from './LabelContainer';

import './TopologyModelRenderer.styles.scss';

interface Props {
  topology: { nodes: any[], links: any[] };
  showWait: boolean;
  onStartSimulation: () => void;
  topologyName: string;
}

interface State {
}

export class TopologyModelRenderer extends React.Component<Props, State> {

  private _canvas: Selection<SVGSVGElement, any, any, any> = null;
  private _container: Selection<SVGGElement, any, any, any> = null;
  private _svg: SVGSVGElement = null;
  private readonly _zoomConfigs = {
    ieee8500: { x: 55.164249877758266, y: -139.96588467618716, k: 0.02029557042757985 },
    ieee123: { x: 198.39621983106292, y: 25.86191550179683, k: 0.1024394509185199 }
  }
  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    this._canvas = select<SVGSVGElement, any>(this._svg);
    this._container = this._canvas.select<SVGGElement>('g');
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props.topology !== newProps.topology)
      this._render(newProps.topology);
  }

  render() {
    return (
      <div className='topology-model-renderer'>
        <header>
          <Button onClick={this.props.onStartSimulation}><Glyphicon glyph='play' /></Button>
        </header>
        <svg ref={elem => this._svg = elem} className={this.props.topologyName}>
          <g></g>
          <LabelContainer />
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

    const xExtent = extent(elementData, (d: any) => d.x);
    const yExtent = extent(elementData, (d: any) => d.y);
    const xOffset = -xExtent[0];
    const yOffset = -yExtent[0];

    const zoomCenter = this._zoomConfigs[this.props.topologyName];
    this._container.selectAll('g').remove();
    const zoomer = zoom()
      .on('zoom', () => this._container.attr('transform', currentEvent.transform));

    this._canvas.call(zoomer)
      .call(zoomer.transform, zoomIdentity.translate(zoomCenter.x, zoomCenter.y).scale(zoomCenter.k));

    this._container.attr('transform', `translate(${zoomCenter.x},${zoomCenter.y}) scale(${zoomCenter.k})`);

    const linkGroup = this._container.append('g')
      .attr('class', 'links');
    const elementGroup = this._container.append('g')
      .attr('class', 'elements');
    const circles = elementGroup.selectAll('circle.element')
      .data(elementData)
      .enter().append('g')
      .filter(element => element.x !== undefined && element.y !== undefined)
      .each(element => {
        element.rendering_x = element.x + xOffset;
        element.rendering_y = element.y + yOffset;

        // Add an underscore to guard against names that contain only numbers which
        // will make d3 complain because they are not valid selectors
        let className = 'element _' + element.name;
        let isCapacitor = false;
        let isRegulator = false;
        element.children.forEach(child => {
          className += ' ' + this._getChildName(child);

          if (child.type == 'capacitors')
            isCapacitor = true;
          if (child.type == 'regulators')
            isRegulator = true;
        });

        if (isCapacitor)
          className += ' capacitors';

        if (isRegulator)
          className += ' regulators';
        element.rendering_baseClass = className;
      })
      .attr('class', element => element.rendering_baseClass)
      .append('circle')
      .attr('cx', element => element.rendering_x)
      .attr('cy', element => element.rendering_y)
      .attr('r', element => {
        // If the element has a capacitor child, 
        // color it differently
        if (element.children.length === 0)
          return 50;
        else if (element.children[0].type === 'capacitors' || element.children[0].type === 'regulators')
          return 150;
        return 50;
      });

    // Add tooltips to the node circles
    circles.append('title')
      .text((element) => {
        if (element.children.length == 0)
          return 'Node: ' + element.name + ' (' + element.x + ',' + element.y + ')';
        else if (element.children[0].type == 'capacitors')
          return 'Capacitor: ' + this._getChildName(element.children[0]);
        else if (element.children[0].type == 'regulators')
          return 'Regulator: ' + element.children[0].name;
        return '';
      });

    // A line function for the links
    const lineGenerator: any = line()
      .x((d: any) => d.element.x + xOffset)
      .y((d: any) => d.element.y + yOffset)

    linkGroup.selectAll('path.link')
      .data(model.links)
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
}