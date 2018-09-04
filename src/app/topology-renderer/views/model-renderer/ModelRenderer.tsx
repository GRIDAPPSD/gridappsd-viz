import * as React from 'react';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { zoom, zoomIdentity } from 'd3-zoom';
import { select, event as currentEvent, Selection } from 'd3-selection';

import { Wait } from '../../../shared/views/wait/Wait';
import { Tooltip } from '../../../shared/views/tooltip/Tooltip';
import { Node } from '../../models/Node';
import { Edge } from '../../models/Edge';
import { TransformWatcherService } from '../../../services/TransformWatcherService';

import './ModelRenderer.scss';

interface Props {
  topology: { nodes: Node[], edges: Edge[] };
  showWait: boolean;
  topologyName: string;
}

interface State {
}

const imageNamesForTypes = {
  capacitor: '../images/capacitor-condenser.png',
  regulator: '../images/regulator.png',
  transformer: '../images/electric-transformer_1.png',
  switch: '../images/switch-closed.png'
};

export class ModelRenderer extends React.Component<Props, State> {

  private readonly _transformWatcherService = TransformWatcherService.getInstance();
  private _canvas: Selection<SVGSVGElement, any, any, any> = null;
  private _container: Selection<SVGGElement, any, any, any> = null;
  private _svg: SVGSVGElement = null;
  private _showNodeSymbols = false;


  private readonly _zoomConfigs = {
    ieee8500: { x: 260.4093929510776, y: 73.17314737715492, k: 0.013690402749858915 },
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
      this._toggleNodeSymbols(currentEvent.transform.k);
      this._transformWatcherService.notify();
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

  private _addTooltipTrigger() {
    let tooltip: Tooltip = null;

    this._canvas.on('mouseover', () => {
      const target = select(currentEvent.target);
      if (target.classed('node')) {
        let content = '';
        const node = target.datum() as Node;
        switch (node.type) {
          case 'capacitor':
            content = 'Capacitor: ' + this._removePhaseNameFromNodeName(node.name);
            break;
          case 'regulator':
            content = 'Regulator: ' + node.name;
            break;
          default:
            content = `${this._capitalize(node.type)}: ${node.name} (${node.x}, ${node.y})`;
            break;
        }
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

  private _capitalize(value: string) {
    return value[0].toUpperCase() + value.substr(1);
  }

  private _createSvgImageElement(attrs: { [key: string]: any }): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    for (const attrName in attrs)
      element.setAttribute(attrName, attrs[attrName]);
    return element;
  }

  private _removePhaseNameFromNodeName(child) {
    return '_' + child.name.replace(/(\D+)(\d)(a|b|c)$/, (_, p1, p2, __) => [p1, p2].join(''));
  }

  private _render(model: { nodes: any[]; edges: any[] }) {
    const nodes = model.nodes;
    console.log(model);

    const xExtent = extent(nodes, (d: Node) => d.x);
    const yExtent = extent(nodes, (d: Node) => d.y);
    const xOffset = -xExtent[0];
    const yOffset = -yExtent[0];
    const zoomCenter = this._zoomConfigs[this.props.topologyName];

    this._container.selectAll('g').remove();
    this._canvas.call(this._zoomer)
      .call(this._zoomer.transform, zoomIdentity.translate(zoomCenter.x, zoomCenter.y).scale(zoomCenter.k));

    this._container.attr('transform', `translate(${zoomCenter.x},${zoomCenter.y}) scale(${zoomCenter.k})`);

    this._renderEdges(model.edges, xOffset, yOffset);
    this._renderNodes(model.nodes, xOffset, yOffset);
  }

  private _renderEdges(edgeData: Edge[], xOffset, yOffset) {
    const edges = this._container.append('g')
      .attr('class', 'edges');

    const lineGenerator: any = line<{ edge: Edge; node: Node }>()
      .x(data => data.node.x + xOffset)
      .y(data => data.node.y + yOffset)

    edges.selectAll('path')
      .data(edgeData)
      .enter()
      .append('path')
      .classed('edge', true)
      .filter(edge => [edge.from.x, edge.from.y, edge.to.x, edge.to.y].every(e => e !== undefined))
      .datum(edge => [{ edge, node: edge.from }, { edge, node: edge.to }])
      .attr('class', (d: Array<{ edge: Edge; node: Node }>) => 'edge ' + d[0].edge.name)
      .attr('stroke', (d: Array<{ edge: Edge; node: Node }>) => {
        switch (d[0].edge.data.phases) {
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

  private _renderNodes(nodeData: Node[], xOffset, yOffset) {
    const nodes = this._container.append('g')
      .attr('class', 'nodes');

    nodes.selectAll('circle')
      .data(nodeData)
      .enter()
      .filter(node => node.x !== undefined && node.y !== undefined)
      .each(node => {
        node.screenX = node.x + xOffset;
        node.screenY = node.y + yOffset;
      })
      // .filter(node => !(['regulator', 'capacitor', 'transformer', 'switch'].includes(node.type)))
      .append('circle')
      .attr('class', node => `node ${node.type} _${node.name}_`)
      .attr('cx', node => node.screenX)
      .attr('cy', node => node.screenY)
      .attr('r', node => {
        switch (node.type) {
          case 'node':
            return 50;
          case 'capacitor':
          case 'regulator':
          case 'switch':
          case 'transformer':
          case 'swing_node':
            return 150;
          default:
            return 50;
        }
      });
  }

  private _replaceCirclesWithSymbols() {
    const images = document.createDocumentFragment();
    for (const node of this.props.topology.nodes) {
      if (node.type in imageNamesForTypes) {
        this._container.select(`.node.${node.type}._${node.name}_`)
          .classed('symbolized', true)
          .style('visibility', 'hidden');
        const fromNode = this._container.select('._' + node.data.from + '_');
        const toNode = this._container.select('._' + node.data.to + '_');
        let angle = 0;
        let distance = 0;
        if (!fromNode.empty() && !toNode.empty()) {
          const fromNodeData = fromNode.datum() as Node;
          const toNodeData = toNode.datum() as Node;
          const horizontal = Math.abs(fromNodeData.x - toNodeData.x);
          const vertical = Math.abs(fromNodeData.y - toNodeData.y);
          angle = 90 - Math.abs(Math.atan(horizontal / vertical) * 180 / Math.PI);
          distance = Math.abs(Math.sqrt((fromNodeData.x - toNodeData.x) ** 2 + (fromNodeData.y - toNodeData.y) ** 2));
        }
        images.appendChild(this._createSvgImageElement({
          href: imageNamesForTypes[node.type],
          width: 500,
          height: 500,
          x: node.screenX,
          y: node.screenY,
          style: `transform-origin: calc(${node.screenX}px + 250px) calc(${node.screenY}px + 250px); transform: rotate(-${angle}deg)`
          // style: `transform-origin: calc(${node.screenX}px + 250px) calc(${node.screenY}px + 250px); transform: rotate(-${angle}deg) translate(calc(-${distance}px / 2), calc(-${distance}px + 175px))`
        }));
      }
    }
    this._container.append<SVGElement>('g')
      .attr('class', 'images')
      .node()
      .appendChild(images);
  }

  private _replaceSymbolsWithCircles() {
    this._container.select('g.images')
      .remove();
    this._container.select('g.nodes')
      .selectAll('.symbolized')
      .classed('symbolized', false)
      .style('visibility', 'visible');
  }

  private _toggleNodeSymbols(currentTransformScaleDegree: number) {
    if (currentTransformScaleDegree > 0.06 && !this._showNodeSymbols) {
      this._showNodeSymbols = true;
      this._replaceCirclesWithSymbols();
    }
    else if (currentTransformScaleDegree < 0.06 && this._showNodeSymbols) {
      this._showNodeSymbols = false;
      this._replaceSymbolsWithCircles();
    }
  }

}