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
import { Switch } from '../../../models/topology/Switch';

import './ModelRenderer.scss';

interface Props {
  topology: { nodes: Node[], edges: Edge[] };
  showWait: boolean;
  topologyName: string;
  onToggleSwitch: (swjtch: Switch) => void;
}

interface State {
}

export class ModelRenderer extends React.Component<Props, State> {

  private readonly _transformWatcherService = TransformWatcherService.getInstance();
  private _canvas: Selection<SVGSVGElement, any, any, any> = null;
  private _container: Selection<SVGGElement, any, any, any> = null;
  private _svg: SVGSVGElement = null;
  private _showNodeSymbols = false;
  private readonly _zoomConfigs = {
    ieee8500: { x: 260.4093929510776, y: 73.17314737715492, k: 0.013690402749858915 },
    ieee123: { x: 340.1487935608565, y: 221.36427239273797, k: 0.05812524487428157 }
  }
  private readonly _zoomer = zoom();
  private readonly _edgeGenerator = line<{ edge: Edge; node: Node }>()
    .x(d => d.node.screenX)
    .y(d => d.node.screenY);

  private readonly _symbolSize = 400;
  private readonly _halfSymbolSize = this._symbolSize / 2;

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
    this._addClickListener();
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props.topology !== newProps.topology)
      this._render(newProps.topology);
  }

  componentWillUnmount() {
    this._canvas.on('mouseover mouseout click', null);
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

  private _addClickListener() {
    this._canvas.on('click', () => {
      const target = select(currentEvent.target);
      if (target.classed('switch')) {
        const rotateTransform = target.node().style.transform.split(' ').pop();
        const swjtch = target.datum() as Switch;
        if (!rotateTransform.includes('rotate'))
          throw new Error('Transform should include rotate()');
        if (swjtch.open) {
          target.attr('href', '../images/switch-closed.png');
          target.style('transform-origin', (node: Node) => `${node.screenX + this._halfSymbolSize}px ${node.screenY + this._halfSymbolSize}px`)
            .style('transform', `translate(${-this._halfSymbolSize}px, ${-this._halfSymbolSize}px) ${rotateTransform}`);
        }
        else {
          target.attr('href', '../images/switch-open.png');
          target.style('transform-origin', (node: Node) => `${node.screenX + this._halfSymbolSize - 40}px ${node.screenY + this._halfSymbolSize + 13}px`)
            .style('transform', `translate(${-this._halfSymbolSize + 40}px, ${-this._halfSymbolSize - 13}px) ${rotateTransform}`);
        }
        swjtch.open = !swjtch.open;
        this.props.onToggleSwitch(swjtch);
      }
    });
  }

  private _addTooltipTrigger() {
    let tooltip: Tooltip = null;

    this._canvas.on('mouseover', () => {
      const target = select(currentEvent.target);
      if (target.classed('node') || target.classed('symbol')) {
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

  private _calculateCoordinatesForEdgeEndpoints(edges: Edge[], xOffset: number, yOffset: number): { [fromNode: string]: Edge } {
    const edgesKeyedByNodeNames: { [fromNode: string]: Edge } = {};
    for (const edge of edges) {
      if (edge.from.screenX === -1 || edge.from.screenY === -1) {
        edge.from.screenX = edge.from.x + xOffset;
        edge.from.screenY = edge.from.y + yOffset;
      }
      if (edge.to.screenX === -1 || edge.to.screenY === -1) {
        edge.to.screenX = edge.to.x + xOffset;
        edge.to.screenY = edge.to.y + yOffset;
      }
      edgesKeyedByNodeNames[edge.from.name] = edge;
      edgesKeyedByNodeNames[edge.to.name] = edge;
    }
    return edgesKeyedByNodeNames;
  }

  private _calculateAngleBetweenEdgeAndXAxis(edge: Edge): number {
    const from = edge.from;
    const to = edge.to;
    const horizontal = Math.abs(from.x - to.x);
    const vertical = Math.abs(from.y - to.y);
    const angle = Math.atan(vertical / horizontal) * 180 / Math.PI;
    // First quadrant or third quadrant
    if (to.x > from.x && to.y < from.y || to.x < from.x && to.y > from.y)
      return -angle;
    // Second quadrant or fourth quadrant 
    if (to.x < from.x && to.y < from.y || to.x > from.x && to.y > from.y)
      return angle;
    // No rotation
    if (from.y === to.y)
      return 0;
    // Perpendicular to x axis
    if (from.x === to.x)
      return 90;
    return angle;
  }

  private _capitalize(value: string) {
    return value[0].toUpperCase() + value.substr(1);
  }

  private _categorizeNodes(nodes: Node[], xOffset: number, yOffset: number) {
    const categories: { nodesWithKnownTypes: Node[]; nodesWithUnknownType: Node[] } = {
      nodesWithKnownTypes: [],
      nodesWithUnknownType: []
    };

    for (const node of nodes) {
      node.screenX = node.x + xOffset;
      node.screenY = node.y + yOffset;
      if (node.type === 'unknown')
        categories.nodesWithUnknownType.push(node);
      else
        categories.nodesWithKnownTypes.push(node);
    }
    return categories;
  }

  private _createSvgElement(elementName: string, attrs: { [key: string]: any }): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', elementName);
    for (const attrName in attrs)
      element.setAttribute(attrName, attrs[attrName]);
    return element;
  }

  private _hideSymbols() {
    this._container.select('.symbols')
      .style('visibility', 'hidden');
    this._container.select('.symbolized-nodes')
      .style('visibility', 'visible');
  }

  private _getZoomConfig(nodeCounts: number) {
    if (nodeCounts <= 1000)
      return this._zoomConfigs.ieee123;
    return this._zoomConfigs.ieee8500;
  }

  private _removePhaseNameFromNodeName(child) {
    return child.name ? '_' + child.name.replace(/(\D+)(\d)(a|b|c)$/, (_, p1, p2, __) => [p1, p2].join('')) : '(I have no name)';
  }

  private _render(model: { nodes: any[]; edges: any[] }) {
    const xExtent = extent(model.nodes, (d: Node) => d.x);
    const yExtent = extent(model.nodes, (d: Node) => d.y);
    const xOffset = -xExtent[0];
    const yOffset = -yExtent[0];
    const zoomCenter = this._getZoomConfig(model.nodes.length);
    const edgesKeyedByNodeNames = this._calculateCoordinatesForEdgeEndpoints(model.edges, xOffset, yOffset);
    const categories = this._categorizeNodes(model.nodes, xOffset, yOffset);
    this._container.selectAll('g')
      .remove();
    this._canvas.call(this._zoomer)
      .call(this._zoomer.transform, zoomIdentity.translate(zoomCenter.x, zoomCenter.y).scale(zoomCenter.k));

    this._container.attr('transform', `translate(${zoomCenter.x},${zoomCenter.y}) scale(${zoomCenter.k})`);

    this._renderEdges(model.edges);
    this._renderSymbolsForNodesWithKnownTypes(edgesKeyedByNodeNames, categories.nodesWithKnownTypes);
    if (model.nodes.length <= 1000)
      this._renderNodes(categories.nodesWithUnknownType, 'unknown-nodes');
    this._renderNodes(categories.nodesWithKnownTypes, 'symbolized-nodes');
  }

  private _renderEdges(edgeData: Edge[]) {
    const edges = select(this._createSvgElement('g', { 'class': 'edges' }));

    edges.selectAll('path')
      .data(edgeData)
      .enter()
      .append('path')
      .classed('edge', true)
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
      .attr('d', this._edgeGenerator);

    this._container.node()
      .appendChild(edges.node());
  }

  private _renderNodes(nodeData: Node[], containerClassName: string) {
    const nodes = select(this._createSvgElement('g', { 'class': containerClassName }));

    nodes.selectAll('circle')
      .data(nodeData)
      .enter()
      .append('circle')
      .attr('class', node => `node ${node.type} _${node.name}_`)
      .attr('cx', node => node.screenX)
      .attr('cy', node => node.screenY)
      .attr('r', node => {
        switch (node.type) {
          case 'unknown':
            return 50;
          case 'capacitor':
          case 'regulator':
          case 'switch':
          case 'transformer':
          case 'swing_node':
            return 75;
          default:
            return 50;
        }
      });

    this._container.node()
      .appendChild(nodes.node());
  }

  private _renderSymbolsForNodesWithKnownTypes(edgesKeyedByNodeNames: { [nodeName: string]: Edge }, nodesWithKnownTypes: Node[]) {
    const symbols = select(this._createSvgElement('g', { 'class': 'symbols', 'style': 'visibility: hidden' }));
    const symbolsForTypes = {
      capacitor: '../images/capacitor.png',
      regulator: '../images/regulator.png',
      transformer: '../images/transformer.png',
      switch: '../images/switch-closed.png',
      swing_node: '../images/substation.png'
    };
    const notSwitches = symbols.append('g')
      .selectAll('image')
      .data(nodesWithKnownTypes.filter(node => node.type !== 'switch'));
    const switches = symbols.append('g')
      .selectAll('image')
      .data(nodesWithKnownTypes.filter(node => node.type === 'switch'));
    [notSwitches, switches].forEach(selection => {
      selection.enter()
        .append('image')
        .attr('class', node => `symbol${node.type ? ' ' + node.type : ''}`)
        .attr('href', node => symbolsForTypes[node.type])
        .attr('width', this._symbolSize)
        .attr('height', this._symbolSize)
        .attr('x', node => node.screenX)
        .attr('y', node => node.screenY)
        .style('transform-origin', node => `${node.screenX + this._halfSymbolSize}px ${node.screenY + this._halfSymbolSize}px`)
        .style('transform', node => {
          if (!node.data || !node.data.from || !node.data.to)
            return 'rotate(0) translate(0, 0)';
          const edge = edgesKeyedByNodeNames[node.data.from] || edgesKeyedByNodeNames[node.data.to];
          if (!edge)
            return 'rotate(0) translate(0, 0)';
          return `translate(${-this._halfSymbolSize}px, ${-this._halfSymbolSize}px) rotate(${this._calculateAngleBetweenEdgeAndXAxis(edge)}deg)`;
        });
    });
    this._container.node()
      .appendChild(symbols.node());
  }

  private _showSymbols() {
    this._container.select('.symbols')
      .style('visibility', 'visible');
    this._container.select('.symbolized-nodes')
      .style('visibility', 'hidden');
  }

  private _toggleNodeSymbols(currentTransformScaleDegree: number) {
    if (currentTransformScaleDegree > 0.06 && !this._showNodeSymbols) {
      this._showNodeSymbols = true;
      this._showSymbols();
    }
    else if (currentTransformScaleDegree < 0.06 && this._showNodeSymbols) {
      this._showNodeSymbols = false;
      this._hideSymbols();
    }
  }

}