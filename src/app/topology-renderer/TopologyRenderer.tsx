import * as React from 'react';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { zoom, zoomIdentity } from 'd3-zoom';
import { select, event as currentEvent, Selection } from 'd3-selection';

import { MapTransformWatcherService } from '@shared/MapTransformWatcherService';
import { Switch, Capacitor, OverheadLine, Node, Edge, Regulator } from '@shared/topology';
import { Tooltip } from '@shared/tooltip';
import { Wait } from '@shared/wait';
import { OverlayService } from '@shared/overlay';
import { SwitchMenu } from './views/switch-menu/SwitchMenu';
import { CapacitorMenu } from './views/capacitor-menu/CapacitorMenu';
import { RegulatorMenu } from './views/regulator-menu/RegulatorMenu';

import './TopologyRenderer.scss';

interface Props {
  topology: { nodes: Node[], edges: Edge[] };
  showWait: boolean;
  topologyName: string;
  onToggleSwitch: (swjtch: Switch) => void;
  onCapacitorMenuFormSubmitted: (currentCapacitor: Capacitor, newCapacitor: Capacitor) => void;
  onRegulatorMenuFormSubmitted: (currentRegulator: Regulator, newRegulator: Regulator) => void;
}

interface State {
}

export class TopologyRenderer extends React.Component<Props, State> {

  private readonly _transformWatcherService = MapTransformWatcherService.getInstance();
  private readonly _overlay = OverlayService.getInstance();
  private readonly _zoomConfigs = {
    ieee8500: { x: 260.4093929510776, y: 73.17314737715492, k: 0.013690402749858915 },
    ieee123: { x: 340.1487935608565, y: 221.36427239273797, k: 0.05812524487428157 }
  };
  private readonly _zoomer = zoom();
  private readonly _edgeGenerator = line<{ edge: Edge; node: Node }>()
    .x(d => d.node.screenX)
    .y(d => d.node.screenY);
  private readonly _symbolSize = 400;
  private readonly _symbolsForTypes = {
    capacitor: './assets/images/capacitor.svg',
    regulator: './assets/images/regulator.svg',
    transformer: './assets/images/transformer.svg',
    switch: './assets/images/switch-closed.svg',
    swing_node: './assets/images/substation.svg'
  };
  private readonly _symbolDimensions = {
    capacitor: { width: 52 * 4, height: 32 * 4 },
    regulator: { width: 48 * 4, height: 103 * 4 },
    transformer: { width: 31 * 4, height: 149 * 4 },
    switch: { width: 123 * 4, height: 16 * 4 },
    swing_node: { width: this._symbolSize, height: this._symbolSize }
  };

  private _canvas: Selection<SVGSVGElement, any, any, any> = null;
  private _container: Selection<SVGGElement, any, any, any> = null;
  private _svg: SVGSVGElement = null;
  private _showNodeSymbols = false;
  private _tooltip: Tooltip;

  constructor(props: any) {
    super(props);
    this.state = {
    };

    this.showMenuOnComponentClicked = this.showMenuOnComponentClicked.bind(this);
    this.showTooltip = this.showTooltip.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
  }

  componentDidMount() {
    this._canvas = select<SVGSVGElement, any>(this._svg);
    this._container = this._canvas.select<SVGGElement>('g');
    this._zoomer.on('zoom', () => {
      this._container.attr('transform', currentEvent.transform);
      this._toggleNodeSymbols(currentEvent.transform.k);
      this._transformWatcherService.notify();
    });
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props.topology !== newProps.topology)
      this._render(newProps.topology);
  }

  render() {
    return (
      <div className='model-renderer'>
        <svg
          ref={elem => this._svg = elem}
          width='1000'
          height='1000'
          className={this.props.topologyName}
          onClick={this.showMenuOnComponentClicked}
          onMouseOver={this.showTooltip}
          onMouseOut={this.hideTooltip}>
          <g />
        </svg>
        <Wait show={this.props.showWait} />
      </div>
    );
  }

  showMenuOnComponentClicked(event) {
    const target = select(event.target);
    if (target.classed('switch'))
      this._onSwitchClicked(target);
    else if (target.classed('capacitor'))
      this._onCapacitorClicked(target);
    else if (target.classed('regulator'))
      this._onRegulatorClicked(target);
  }

  private _onSwitchClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>) {
    const clickedElementRect = clickedElement.node().getBoundingClientRect();
    const swjtch = clickedElement.datum() as Switch;
    this._overlay.show(
      <SwitchMenu
        left={clickedElementRect.left}
        top={clickedElementRect.top}
        open={swjtch.open}
        onCancel={() => this._overlay.hide(false)}
        onConfirm={open => {
          this._overlay.hide(false);
          this._toggleSwitch(open, swjtch, clickedElement);
        }} />,
      false
    );
  }

  private _toggleSwitch(open: boolean, swjtch: Switch, clickedElement: Selection<SVGElement, Node, SVGElement, any>) {
    if (swjtch.open !== open) {
      const rotateTransform = clickedElement.node().style.transform.split(' ').pop();
      if (!rotateTransform.includes('rotate'))
        throw new Error('Transform should include rotate()');
      if (open) {
        clickedElement.attr('href', './assets/images/switch-open.svg')
          .attr('height', 22 * 4)
          .style('transform-origin', node => `${node.screenX + this._symbolDimensions[node.type].width / 2}px ${node.screenY + 22}px`)
          .style('transform', node => `translate(${-this._symbolDimensions[node.type].width / 2}px, -55px) ${rotateTransform}`);
      }
      else {
        clickedElement.attr('href', './assets/images/switch-closed.svg')
          .attr('height', node => this._symbolDimensions[node.type].height)
          .style('transform-origin', node => `${node.screenX + this._symbolDimensions[node.type].width / 2}px ${node.screenY + this._symbolDimensions[node.type].height / 2}px`)
          .style('transform', node => `translate(${-this._symbolDimensions[node.type].width / 2}px, ${-this._symbolDimensions[node.type].height / 2}px) ${rotateTransform}`);
      }
      swjtch.open = open;
      this.props.onToggleSwitch(swjtch);
    }
  }

  private _onCapacitorClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>) {
    const clickedElementRect = clickedElement.node().getBoundingClientRect();
    const capacitor = clickedElement.datum() as Capacitor;
    this._overlay.show(
      <CapacitorMenu
        left={clickedElementRect.left}
        top={clickedElementRect.top}
        capacitor={capacitor}
        onCancel={() => this._overlay.hide(false)}
        onConfirm={newCapacitor => {
          this._overlay.hide(false);
          this.props.onCapacitorMenuFormSubmitted(capacitor, newCapacitor);
        }} />,
      false
    );
  }

  private _onRegulatorClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>) {
    const clickedElementRect = clickedElement.node().getBoundingClientRect();
    const regulator = clickedElement.datum() as Regulator;
    this._overlay.show(
      <RegulatorMenu
        left={clickedElementRect.left}
        top={clickedElementRect.top}
        regulator={regulator}
        onCancel={() => this._overlay.hide(false)}
        onConfirm={newRegulator => {
          this._overlay.hide(false);
          this.props.onRegulatorMenuFormSubmitted(regulator, newRegulator);
        }} />,
      false
    );
  }

  showTooltip(event) {
    const target = select(event.target);
    if (target.classed('node') || target.classed('symbol')) {
      let content = '';
      const node = target.datum() as Node;
      switch (node.type) {
        case 'capacitor':
          content = 'Capacitor: ' + node.name;
          break;
        case 'regulator':
          content = 'Regulator: ' + node.name;
          break;
        default:
          content = `${this._capitalize(node.type)}: ${node.name} (${node.x}, ${node.y})`;
          break;
      }
      this._tooltip = new Tooltip({ position: 'bottom', content });
      this._tooltip.showAt(target.node());
    }
  }

  hideTooltip() {
    if (this._tooltip) {
      this._tooltip.hide();
      this._tooltip = null;
    }
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
    return value ? value[0].toUpperCase() + value.substr(1) : '';
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

  private _render(model: { nodes: Node[]; edges: Edge[] }) {
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
    if (model.nodes.length <= 1000)
      this._renderNodes(categories.nodesWithUnknownType, 'unknown-nodes');
    this._renderNodes(categories.nodesWithKnownTypes, 'symbolized-nodes');
    this._renderSymbolsForNodesWithKnownTypes(edgesKeyedByNodeNames, categories.nodesWithKnownTypes);
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
        switch ((d[0].edge as OverheadLine).phases) {
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
        .attr('href', node => this._symbolsForTypes[node.type])
        .attr('width', node => this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].width : this._symbolSize)
        .attr('height', node => this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].height : this._symbolSize)
        .attr('x', node => node.screenX)
        .attr('y', node => node.screenY)
        .style('transform-origin', node => `${node.screenX + (this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].width : this._symbolSize) / 2}px ${node.screenY + (this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].height : this._symbolSize) / 2}px`)
        .style('transform', (node: any) => {
          if (!node.from || !node.to)
            return 'rotate(0) translate(0, 0)';
          const edge = edgesKeyedByNodeNames[node.from] || edgesKeyedByNodeNames[node.to];
          if (!edge)
            return 'rotate(0) translate(0, 0)';
          return `translate(${-(this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].width : this._symbolSize) / 2}px, ${-(this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].height : this._symbolSize) / 2}px) rotate(${this._calculateAngleBetweenEdgeAndXAxis(edge)}deg)`;
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
