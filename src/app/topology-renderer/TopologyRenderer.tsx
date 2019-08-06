import * as React from 'react';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { zoom } from 'd3-zoom';
import { select, event as currentEvent, Selection } from 'd3-selection';
import { scaleLinear, ScaleLinear } from 'd3';

import { MapTransformWatcherService } from '@shared/MapTransformWatcherService';
import { Switch, Capacitor, Node, Edge, Regulator } from '@shared/topology';
import { Tooltip } from '@shared/tooltip';
import { Wait } from '@shared/wait';
import { OverlayService } from '@shared/overlay';
import { SwitchMenu } from './views/switch-menu/SwitchMenu';
import { CapacitorMenu } from './views/capacitor-menu/CapacitorMenu';
import { RegulatorMenu } from './views/regulator-menu/RegulatorMenu';
import { RenderableTopology } from './models/RenderableTopology';

import './TopologyRenderer.scss';

interface Props {
  topology: RenderableTopology;
  showWait: boolean;
  topologyName: string;
  onToggleSwitch: (swjtch: Switch) => void;
  onCapacitorMenuFormSubmitted: (currentCapacitor: Capacitor, newCapacitor: Capacitor) => void;
  onRegulatorMenuFormSubmitted: (currentRegulator: Regulator, newRegulator: Regulator) => void;
}

interface State {
}

export class TopologyRenderer extends React.Component<Props, State> {

  svg: SVGSVGElement = null;

  private readonly _transformWatcherService = MapTransformWatcherService.getInstance();
  private readonly _overlay = OverlayService.getInstance();
  private readonly _zoomer = zoom();
  private readonly _edgeGenerator = line<{ edge: Edge; node: Node }>()
    .x(d => d.node.screenX)
    .y(d => d.node.screenY);
  private readonly _symbolSize = 15;
  private readonly _symbolsForTypes = {
    capacitor: './assets/images/capacitor.svg',
    regulator: './assets/images/regulator.svg',
    transformer: './assets/images/transformer.svg',
    switch: './assets/images/switch-closed.svg',
    swing_node: './assets/images/substation.svg'
  };
  private readonly _symbolDimensions = {
    capacitor: { width: 52 / 9, height: 32 / 9 },
    regulator: { width: 48 / 9, height: 103 / 9 },
    transformer: { width: 31 / 9, height: 149 / 9 },
    switch: { width: 123 / 9, height: 16 / 9 },
    switch_open: { width: 123 / 9, height: 22 / 9 },
    swing_node: { width: this._symbolSize / 9, height: this._symbolSize / 9 }
  };
  private readonly _xScale: ScaleLinear<number, number> = scaleLinear();
  private readonly _yScale: ScaleLinear<number, number> = scaleLinear();

  private _canvas: Selection<SVGSVGElement, any, any, any> = null;
  private _container: Selection<SVGGElement, any, any, any> = null;
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
    const canvasBoundingBox = this.svg.getBoundingClientRect();
    const spacing = 10;
    this._xScale.range([spacing, canvasBoundingBox.width - spacing]);
    this._yScale.range([spacing, canvasBoundingBox.height - spacing]);
    this._canvas = select<SVGSVGElement, any>(this.svg)
      .call(this._zoomer);
    this._container = this._canvas.select<SVGGElement>('.topology-renderer__canvas__container');
    this._zoomer.on('zoom', () => {
      this._container.attr('transform', currentEvent.transform);
      this._toggleNodeSymbols(currentEvent.transform.k);
      this._transformWatcherService.notify();
    });
  }

  private _toggleNodeSymbols(currentTransformScaleDegree: number) {
    if (currentTransformScaleDegree > 2.5 && !this._showNodeSymbols) {
      this._showNodeSymbols = true;
      this._showSymbols();
    }
    else if (currentTransformScaleDegree < 2.5 && this._showNodeSymbols) {
      this._showNodeSymbols = false;
      this._hideSymbols();
    }
  }

  private _showSymbols() {
    this._container.select('.topology-renderer__canvas__symbol-container')
      .style('visibility', 'visible');
    this._container.select('.topology-renderer__canvas__symbolized-node-container')
      .style('visibility', 'hidden');
  }

  private _hideSymbols() {
    this._container.select('.topology-renderer__canvas__symbol-container')
      .style('visibility', 'hidden');
    this._container.select('.topology-renderer__canvas__symbolized-node-container')
      .style('visibility', 'visible');
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.topology !== prevProps.topology) {
      const topology = this.props.topology;
      const xCoordinateExtent = extent(topology.nodes, (d: Node) => d.x);
      const yCoordinateExtent = extent(topology.nodes, (d: Node) => d.y);
      this._xScale.domain(xCoordinateExtent);
      this._yScale.domain(yCoordinateExtent);
      this._render(topology);
    }
  }

  private _render(topology: RenderableTopology) {
    const edgesKeyedByNodeNames = this._mapEdgeEndpointsCoordinatesToCanvasBoundingBox(topology.edges);
    const categories = this._categorizeNodes(topology.nodes);
    this._container.selectAll('g')
      .remove();
    this._renderEdges(topology.edges);
    if (topology.nodes.length <= 1000)
      this._renderNodes(categories.nodesWithUnknownType, 'topology-renderer__canvas__unknown-node-container');
    this._renderNodes(categories.nodesWithKnownTypes, 'topology-renderer__canvas__symbolized-node-container');
    this._renderSymbolsForNodesWithKnownTypes(edgesKeyedByNodeNames, categories.nodesWithKnownTypes);
  }

  private _mapEdgeEndpointsCoordinatesToCanvasBoundingBox(edges: Edge[]): Map<string, Edge> {
    const edgesKeyedByNodeNames = new Map<string, Edge>();
    for (const edge of edges) {
      if (edge.from.screenX === -1 || edge.from.screenY === -1) {
        edge.from.screenX = this._xScale(edge.from.x);
        edge.from.screenY = this._yScale(edge.from.y);
      }
      if (edge.to.screenX === -1 || edge.to.screenY === -1) {
        edge.to.screenX = this._xScale(edge.to.x);
        edge.to.screenY = this._yScale(edge.to.y);
      }
      edgesKeyedByNodeNames.set(edge.from.name, edge);
      edgesKeyedByNodeNames.set(edge.to.name, edge);
    }
    return edgesKeyedByNodeNames;
  }

  private _categorizeNodes(nodes: Node[]) {
    const categories: { nodesWithKnownTypes: Node[]; nodesWithUnknownType: Node[] } = {
      nodesWithKnownTypes: [],
      nodesWithUnknownType: []
    };

    for (const node of nodes) {
      node.screenX = this._xScale(node.x);
      node.screenY = this._yScale(node.y);
      if (node.type === 'unknown')
        categories.nodesWithUnknownType.push(node);
      else
        categories.nodesWithKnownTypes.push(node);
    }
    return categories;
  }

  private _renderEdges(edgeData: Edge[]) {
    const edges = select(this._createSvgElement('g', { 'class': 'topology-renderer__canvas__edge-container' }));
    edges.selectAll('path')
      .data(edgeData)
      .enter()
      .append('path')
      .datum(edge => [{ edge, node: edge.from }, { edge, node: edge.to }])
      .attr('class', (d: Array<{ edge: Edge; node: Node }>) => 'topology-renderer__canvas__edge ' + d[0].edge.name)
      .attr('d', this._edgeGenerator);

    this._container.node()
      .appendChild(edges.node());
  }

  private _createSvgElement(elementName: string, attrs: { [key: string]: any }): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', elementName);
    for (const attrName in attrs)
      element.setAttribute(attrName, attrs[attrName]);
    return element;
  }

  private _renderNodes(nodeData: Node[], containerClassName: string) {
    const nodes = select(this._createSvgElement('g', { 'class': containerClassName }));
    nodes.selectAll('circle')
      .data(nodeData)
      .enter()
      .append('circle')
      .attr('class', node => `topology-renderer__canvas__node ${node.type} _${node.name}_`)
      .attr('cx', node => node.screenX)
      .attr('cy', node => node.screenY)
      .attr('r', '3');
    this._container.node()
      .appendChild(nodes.node());
  }

  private _renderSymbolsForNodesWithKnownTypes(edgesKeyedByNodeNames: Map<string, Edge>, nodesWithKnownTypes: Node[]) {
    const symbols = select(this._createSvgElement('g', { class: 'topology-renderer__canvas__symbol-container', style: 'visibility: hidden' }));
    const notSwitches = symbols.append('g')
      .selectAll('image')
      .data(nodesWithKnownTypes.filter(node => node.type !== 'switch'));
    const switches = symbols.append('g')
      .selectAll('image')
      .data(nodesWithKnownTypes.filter(node => node.type === 'switch'));
    for (const selection of [notSwitches, switches]) {
      selection.enter()
        .append('image')
        .attr('class', node => `topology-renderer__canvas__symbol${node.type ? ' ' + node.type : ''}`)
        .attr('href', node => this._symbolsForTypes[node.type])
        .attr('width', node => this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].width : this._symbolSize)
        .attr('height', node => this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].height : this._symbolSize)
        .attr('x', node => node.screenX)
        .attr('y', node => node.screenY)
        .style('transform-origin', node => {
          const transformOriginStringTemplate = '${horizontal}px ${vertical}px';
          const symbolDimensions = this._symbolDimensions[node.type];
          return transformOriginStringTemplate.replace(
            '${horizontal}',
            `${node.screenX + (symbolDimensions ? symbolDimensions.width : this._symbolSize) / 2}`
          ).replace(
            '${vertical}',
            `${node.screenY + (symbolDimensions ? symbolDimensions.height : this._symbolSize) / 2}`
          );
        })
        .style('transform', (node: any) => {
          if (!node.from || !node.to)
            return 'rotate(0) translate(0, 0)';
          const edge = edgesKeyedByNodeNames.get(node.from) || edgesKeyedByNodeNames.get(node.to);
          const symbolDimensions = this._symbolDimensions[node.type];
          if (!edge)
            return 'rotate(0) translate(0, 0)';
          const transformStringTemplate = 'translate(${horizontal}px, ${vertical}px) rotate(${angle}deg)';
          return transformStringTemplate.replace(
            '${horizontal}',
            `${-(symbolDimensions ? symbolDimensions.width : this._symbolSize) / 2}`
          ).replace(
            '${vertical}',
            `${-(symbolDimensions ? symbolDimensions.height : this._symbolSize) / 2}`
          ).replace(
            '${angle}',
            `${this._calculateAngleBetweenEdgeAndXAxis(edge)}`
          );
        });
    }
    this._container.node()
      .appendChild(symbols.node());
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

  render() {
    return (
      <div className='topology-renderer'>
        <svg
          ref={elem => this.svg = elem}
          width='1000'
          height='1000'
          className={`topology-renderer__canvas ${this.props.topologyName}`}
          onClick={this.showMenuOnComponentClicked}
          onMouseOver={this.showTooltip}
          onMouseOut={this.hideTooltip}>
          <g className='topology-renderer__canvas__container' />
        </svg>
        <Wait show={this.props.showWait} />
      </div>
    );
  }

  showMenuOnComponentClicked(event: React.SyntheticEvent) {
    const target = select(event.target as SVGElement);
    if (target.classed('switch'))
      this._onSwitchClicked(target);
    else if (target.classed('capacitor'))
      this._onCapacitorClicked(target);
    else if (target.classed('regulator'))
      this._onRegulatorClicked(target);
  }

  private _onSwitchClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>) {
    const clickedElementRect = clickedElement.node()
      .getBoundingClientRect();
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
      const switchDimensions = open ? this._symbolDimensions.switch_open : this._symbolDimensions.switch;
      const switchImage = `./assets/images/${open ? 'switch-open' : 'switch-closed'}.svg`;
      clickedElement.attr('href', switchImage)
        .attr('width', switchDimensions.width)
        .attr('height', switchDimensions.height)
        .style('transform-origin', node => {
          const transformOriginStringTemplate = '${horizontal}px ${vertical}px';
          return transformOriginStringTemplate.replace(
            '${horizontal}',
            `${node.screenX + (switchDimensions.width / 2)}`
          ).replace(
            '${vertical}',
            `${node.screenY + (switchDimensions.height / 2)}`
          );
        })
        .style('transform', () => {
          const transformStringTemplate = 'translate(${horizontal}px, ${vertical}px) ${rotate}';
          return transformStringTemplate.replace(
            '${horizontal}',
            `${-switchDimensions.width / 2}`
          ).replace(
            '${vertical}',
            `${-switchDimensions.height / 2}`
          ).replace(
            '${rotate}',
            rotateTransform
          );
        });
      swjtch.open = open;
      this.props.onToggleSwitch(swjtch);
    }
  }

  private _onCapacitorClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>) {
    const clickedElementRect = clickedElement.node()
      .getBoundingClientRect();
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
    const clickedElementRect = clickedElement.node()
      .getBoundingClientRect();
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

  showTooltip(event: React.SyntheticEvent) {
    const target = select(event.target as SVGElement);
    if (target.classed('topology-renderer__canvas__node') || target.classed('topology-renderer__canvas__symbol')) {
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
      this._tooltip.showAt(target.node() as any);
    }
  }

  private _capitalize(value: string) {
    return value ? value[0].toUpperCase() + value.substr(1) : '';
  }

  hideTooltip() {
    if (this._tooltip) {
      this._tooltip.hide();
      this._tooltip = null;
    }
  }

}
