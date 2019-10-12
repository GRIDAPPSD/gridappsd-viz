import * as React from 'react';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { zoom, zoomIdentity } from 'd3-zoom';
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
import { IconButton } from '@shared/buttons';

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
  readonly overlay = OverlayService.getInstance();

  private readonly _transformWatcherService = MapTransformWatcherService.getInstance();
  private readonly _zoomer = zoom();
  private readonly _edgeGenerator = line<{ edge: Edge; node: Node }>()
    .x(d => d.node.screenX1)
    .y(d => d.node.screenY1);
  private readonly _symbolSize = 35;
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
    switch: { width: 10, height: 10 },
    switch_open: { width: 123 / 9, height: 22 / 9 },
    swing_node: { width: this._symbolSize / 9, height: this._symbolSize / 9 }
  };
  private readonly _xScale: ScaleLinear<number, number> = scaleLinear();
  private readonly _yScale: ScaleLinear<number, number> = scaleLinear();

  private _canvas: Selection<SVGSVGElement, any, any, any> = null;
  private _container: Selection<SVGGElement, any, any, any> = null;
  private _showNodeSymbols = false;
  private _tooltip: Tooltip;

  constructor(props: Props) {
    super(props);

    this.showMenuOnComponentClicked = this.showMenuOnComponentClicked.bind(this);
    this.showTooltip = this.showTooltip.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
    this.reset = this.reset.bind(this);
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
    if (this.props.topology.nodes.length <= 200) {
      if (currentTransformScaleDegree > 1.5 && !this._showNodeSymbols) {
        this._showNodeSymbols = true;
        this._showSymbols();
      }
      else if (currentTransformScaleDegree < 1.5 && this._showNodeSymbols) {
        this._showNodeSymbols = false;
        this._hideSymbols();
      }
    }
    else if (this.props.topology.nodes.length > 200) {
      if (currentTransformScaleDegree > 2.5 && !this._showNodeSymbols) {
        this._showNodeSymbols = true;
        this._showSymbols();
      }
      else if (currentTransformScaleDegree < 2.5 && this._showNodeSymbols) {
        this._showNodeSymbols = false;
        this._hideSymbols();
      }
    }
  }

  private _showSymbols() {
    this._container.select('.topology-renderer__canvas__symbol-container')
      .style('visibility', 'visible');
    this._container.select('.topology-renderer__canvas__non-switch-node-container')
      .style('visibility', 'hidden');
    this._container.select('.topology-renderer__canvas__switch-node-container')
      .style('visibility', 'hidden');
  }

  private _hideSymbols() {
    this._container.select('.topology-renderer__canvas__symbol-container')
      .style('visibility', 'hidden');
    this._container.select('.topology-renderer__canvas__non-switch-node-container')
      .style('visibility', 'visible');
    this._container.select('.topology-renderer__canvas__switch-node-container')
      .style('visibility', 'visible');
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.topology !== prevProps.topology)
      this._render();
  }

  private _render() {
    const topology = this.props.topology;
    const nodeNameToEdgeMap = topology.edges.reduce((map, edge) => {
      map.set(edge.from.name, edge);
      map.set(edge.to.name, edge);
      return map;
    }, new Map<string, Edge>());
    const nodeRadius = topology.nodes.length <= 1000 ? 3 : 1;

    this._xScale.domain(
      extent(topology.nodes, (d: Node) => d.x1)
    );
    this._yScale.domain(
      extent(topology.nodes, (d: Node) => d.y1)
    );

    const categories = this._categorizeNodes(topology.nodes);

    this._container.selectAll('g')
      .remove();
    this._renderEdges(topology.edges);
    if (topology.nodes.length <= 1000)
      this._renderNonSwitchNodes(
        categories.unknownNodes,
        'topology-renderer__canvas__unknown-node-container',
        nodeRadius
      );
    this._renderNonSwitchNodes(
      categories.nonSwitchNodes,
      'topology-renderer__canvas__non-switch-node-container',
      nodeRadius
    );
    this._renderSwitchNodes(categories.switchNodes as Switch[], nodeRadius);
    this._renderSymbolsForNodesWithKnownTypes(
      nodeNameToEdgeMap,
      categories.nonSwitchNodes,
      categories.switchNodes as Switch[]
    );
  }

  private _categorizeNodes(nodes: Node[]) {
    const categories: { nonSwitchNodes: Node[]; switchNodes: Node[]; unknownNodes: Node[] } = {
      nonSwitchNodes: [],
      switchNodes: [],
      unknownNodes: []
    };

    for (const node of nodes) {
      node.screenX1 = this._xScale(node.x1);
      node.screenY1 = this._yScale(node.y1);

      if (node.type === 'switch') {
        (node as Switch).screenX2 = this._xScale((node as Switch).x2);
        (node as Switch).screenY2 = this._yScale((node as Switch).y2);
        (node as Switch).dx = (node as Switch).screenX2 - node.screenX1;
        (node as Switch).dy = (node as Switch).screenY2 - node.screenY1;
      }
      if (node.type === 'unknown')
        categories.unknownNodes.push(node);
      else if (node.type === 'switch')
        categories.switchNodes.push(node);
      else
        categories.nonSwitchNodes.push(node);
    }
    return categories;
  }

  private _renderEdges(edges: Edge[]) {
    const edgeContainer = select(this._createSvgElement('g', { class: 'topology-renderer__canvas__edge-container' }));
    edgeContainer.selectAll('path')
      .data(edges)
      .enter()
      .append('path')
      .datum(edge => [{ edge, node: edge.from }, { edge, node: edge.to }])
      .attr('class', (d: Array<{ edge: Edge; node: Node }>) => 'topology-renderer__canvas__edge ' + d[0].edge.name)
      .attr('d', this._edgeGenerator);

    this._container.node()
      .appendChild(edgeContainer.node());
  }

  private _createSvgElement(elementName: string, attrs: { [key: string]: any }): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', elementName);
    for (const attrName in attrs)
      element.setAttribute(attrName, attrs[attrName]);
    return element;
  }

  private _renderNonSwitchNodes(nonSwitchNodes: Node[], containerClassName: string, nodeRadius: number) {
    const nodeContainer = select(this._createSvgElement('g', { class: containerClassName }));
    nodeContainer.selectAll('circle')
      .data(nonSwitchNodes)
      .enter()
      .append('circle')
      .attr('class', node => `topology-renderer__canvas__node ${node.type} _${node.name}_`)
      .attr('cx', node => node.screenX1)
      .attr('cy', node => node.screenY1)
      .attr('r', nodeRadius);
    this._container.node()
      .appendChild(nodeContainer.node());
  }

  private _renderSwitchNodes(switchNodes: Switch[], nodeRadius: number) {
    const nodeContainer = select(
      this._createSvgElement('g', { class: 'topology-renderer__canvas__switch-node-container' })
    );

    const switches = nodeContainer.selectAll('.topology-renderer__canvas__switch-node')
      .data(switchNodes)
      .enter()
      .append('g')
      .attr('class', node => `topology-renderer__canvas__switch-node _${node.name}_`);

    switches.append('line')
      .attr('x1', node => node.screenX1)
      .attr('y1', node => node.screenY1)
      .attr('x2', node => node.screenX2)
      .attr('y2', node => node.screenY2)
      .attr('stroke-width', '0.2')
      .attr('stroke', '#000');

    switches.append('circle')
      .attr('class', 'topology-renderer__canvas__node switch')
      .attr('cx', node => (node.screenX1 + node.screenX2) / 2)
      .attr('cy', node => (node.screenY1 + node.screenY2) / 2)
      .attr('r', nodeRadius)
      .attr('fill', '#000');

    this._container.node()
      .appendChild(nodeContainer.node());
  }

  private _renderSymbolsForNodesWithKnownTypes(
    nodeNameToEdgeMap: Map<string, Edge>,
    nonSwitchNodes: Node[],
    switchNodes: Switch[]
  ) {
    const symbolContainer = select(
      this._createSvgElement(
        'g',
        {
          class: 'topology-renderer__canvas__symbol-container',
          style: 'visibility: hidden'
        }
      )
    );
    this._renderNonSwitchSymbols(symbolContainer, nonSwitchNodes, nodeNameToEdgeMap);
    this._renderSwitchSymbols(symbolContainer, switchNodes);

    this._container.node()
      .appendChild(symbolContainer.node());
  }

  private _renderNonSwitchSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    nonSwitchNodes: Node[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    container.append('g')
      .selectAll('image')
      .data(nonSwitchNodes)
      .enter()
      .append('image')
      .attr('class', node => `topology-renderer__canvas__symbol${node.type ? ' ' + node.type : ''}`)
      .attr('href', node => this._symbolsForTypes[node.type])
      .attr('width', node => this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].width : this._symbolSize)
      .attr('height', node => this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].height : this._symbolSize)
      .attr('x', node => node.screenX1)
      .attr('y', node => node.screenY1)
      .style('transform-origin', node => {
        const transformOriginStringTemplate = '${horizontal}px ${vertical}px';
        const symbolDimensions = this._symbolDimensions[node.type];
        return transformOriginStringTemplate.replace(
          '${horizontal}',
          `${node.screenX1 + (symbolDimensions ? symbolDimensions.width : this._symbolSize) / 2}`
        ).replace(
          '${vertical}',
          `${node.screenY1 + (symbolDimensions ? symbolDimensions.height : this._symbolSize) / 2}`
        );
      })
      .style('transform', (node: any) => {
        if (!node.from || !node.to)
          return 'rotate(0) translate(0, 0)';
        const edge = nodeNameToEdgeMap.get(node.from) || nodeNameToEdgeMap.get(node.to);
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
          `${this._calculateAngleBetweenLineAndXAxis(edge.from.x1, edge.from.y1, edge.to.x1, edge.to.y1)}`
        );
      });
  }

  private _calculateAngleBetweenLineAndXAxis(x1: number, y1: number, x2: number, y2: number): number {
    const horizontal = Math.abs(x2 - x1);
    const vertical = Math.abs(y2 - y1);
    const angle = Math.atan(vertical / horizontal) * 180 / Math.PI;
    // First quadrant or third quadrant
    if (x2 > x1 && y2 < y1 || x2 < x1 && y2 > y1)
      return -angle;
    // Second quadrant or fourth quadrant
    if (x2 < x1 && y2 < y1 || x2 > x1 && y2 > y1)
      return angle;
    // No rotation
    if (y1 === y2)
      return 0;
    // Perpendicular to x axis
    if (x1 === x2)
      return 90;
    return angle;
  }

  private _renderSwitchSymbols(container: Selection<SVGElement, any, SVGElement, any>, switchNodes: Node[]) {
    if (this.props.topology.nodes.length > 1000) {
      this._symbolDimensions.switch.width = 3;
      this._symbolDimensions.switch.height = 3;
    }
    const width = this._symbolDimensions.switch.width;
    const height = this._symbolDimensions.switch.height;

    const switches = container.append('g')
      .selectAll('.topology-renderer__canvas__symbol.switch')
      .data(switchNodes as Switch[])
      .enter()
      .append('g')
      .attr('class', node => `topology-renderer__canvas__symbol switch _${node.name}_`)
      .attr('transform', node => `translate(${node.screenX1},${node.screenY1})`);
    switches.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', node => node.dx)
      .attr('y2', node => node.dy)
      .attr('stroke-width', '0.2')
      .attr('stroke', '#000');
    switches.append('rect')
      .attr('class', node => `topology-renderer__canvas__symbol switch _${node.name}_`)
      .attr('x', node => (node.dx - width) / 2)
      .attr('y', node => (node.dy - height) / 2)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', node => node.open ? node.colorWhenOpen : node.colorWhenClosed)
      .attr('transform', node => {
        if (!node.from || !node.to)
          return 'rotate(0) translate(0, 0)';
        const angle = this._calculateAngleBetweenLineAndXAxis(
          node.screenX1,
          node.screenY1,
          node.screenX2,
          node.screenY2
        );
        const transformOriginX = (node.dx - width) / 2 + width / 2;
        const transformOriginY = (node.dy - height) / 2 + height / 2;
        return `rotate(${-angle},${transformOriginX},${transformOriginY})`;
      });
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
        <div className='topology-renderer__toolbox'>
          <Tooltip content='Reset'>
            <IconButton
              icon='refresh'
              size='small'
              style='accent'
              onClick={this.reset} />
          </Tooltip>
        </div>
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
    this.overlay.show(
      <SwitchMenu
        left={clickedElementRect.left}
        top={clickedElementRect.top}
        open={swjtch.open}
        onCancel={this.overlay.hide}
        onConfirm={open => {
          this.overlay.hide();
          this._toggleSwitch(open, swjtch, clickedElement);
        }} />
    );
  }

  private _toggleSwitch(open: boolean, swjtch: Switch, clickedElement: Selection<SVGElement, Node, SVGElement, any>) {
    if (swjtch.open !== open) {
      if (clickedElement.classed('topology-renderer__canvas__symbol'))
        clickedElement.attr('fill', open ? swjtch.colorWhenOpen : swjtch.colorWhenClosed);
      // The switch circle node was clicked, so update the fill of the switch symbol
      else
        select(`.topology-renderer__canvas__symbol.switch._${swjtch.name}_`)
          .attr('fill', open ? swjtch.colorWhenOpen : swjtch.colorWhenClosed);
      swjtch.open = open;
      this.props.onToggleSwitch(swjtch);
    }
  }

  private _onCapacitorClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>) {
    const clickedElementRect = clickedElement.node()
      .getBoundingClientRect();
    const capacitor = clickedElement.datum() as Capacitor;
    this.overlay.show(
      <CapacitorMenu
        left={clickedElementRect.left}
        top={clickedElementRect.top}
        capacitor={capacitor}
        onCancel={this.overlay.hide}
        onConfirm={newCapacitor => {
          this.overlay.hide();
          this.props.onCapacitorMenuFormSubmitted(capacitor, newCapacitor);
        }} />
    );
  }

  private _onRegulatorClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>) {
    const clickedElementRect = clickedElement.node()
      .getBoundingClientRect();
    const regulator = clickedElement.datum() as Regulator;
    this.overlay.show(
      <RegulatorMenu
        left={clickedElementRect.left}
        top={clickedElementRect.top}
        regulator={regulator}
        onCancel={this.overlay.hide}
        onConfirm={newRegulator => {
          this.overlay.hide();
          this.props.onRegulatorMenuFormSubmitted(regulator, newRegulator);
        }} />
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
          content = `${this._capitalize(node.type)}: ${node.name} (${node.x1}, ${node.y1})`;
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

  reset() {
    this._container.transition()
      .on('end', () => {
        this._canvas.call(this._zoomer.transform, zoomIdentity);
      })
      .attr('transform', 'translate(0, 0) scale(1)');
  }

}
