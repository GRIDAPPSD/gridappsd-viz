import * as React from 'react';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { select, event as currentEvent, Selection } from 'd3-selection';
import { scaleLinear, ScaleLinear } from 'd3';

import { MapTransformWatcherService } from '@shared/MapTransformWatcherService';
import { Switch, Capacitor, Node, Edge, Regulator, Transformer } from '@shared/topology';
import { Tooltip } from '@shared/tooltip';
import { OverlayService } from '@shared/overlay';
import { SwitchMenu } from './views/switch-menu/SwitchMenu';
import { CapacitorMenu } from './views/capacitor-menu/CapacitorMenu';
import { RegulatorMenu } from './views/regulator-menu/RegulatorMenu';
import { RenderableTopology } from './models/RenderableTopology';
import { IconButton } from '@shared/buttons';
import { NodeSearcher } from './views/node-searcher/NodeSearcher';
import { MatchedNodeLocator } from './views/matched-node-locator/MatchedNodeLocator';
import { NotificationBanner } from '@shared/notification-banner';

import './TopologyRenderer.light.scss';
import './TopologyRenderer.dark.scss';

interface Props {
  topology: RenderableTopology;
  showWait: boolean;
  onToggleSwitch: (swjtch: Switch, open: boolean) => void;
  onCapacitorMenuFormSubmitted: (currentCapacitor: Capacitor, newCapacitor: Capacitor) => void;
  onRegulatorMenuFormSubmitted: (currentRegulator: Regulator, newRegulator: Regulator) => void;
}

interface State {
  showNodeSearcher: boolean;
  nodeToLocate: SVGCircleElement;
  nonExistingSearchedNode: Node;
}

export class TopologyRenderer extends React.Component<Props, State> {

  svg: SVGSVGElement = null;
  readonly overlay = OverlayService.getInstance();

  private readonly _transformWatcherService = MapTransformWatcherService.getInstance();
  private readonly _zoomer = zoom<SVGElement, any>();
  private readonly _edgeGenerator = line<Node>()
    .x(node => node.screenX1)
    .y(node => node.screenY1);
  private readonly _symbolSize = 35;
  private readonly _scalingFactorPerSymbolTable = {
    capacitor: 1,
    regulator: 1,
    transformer: 1,
    switch: 1,
    swing_node: 1
  };
  private readonly _symbolDimensions = {
    capacitor: { width: 52, height: 20 },
    regulator: { width: 48 / 9, height: 103 / 9 },
    transformer: { width: 30, height: 25 },
    switch: { width: 10, height: 10 },
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

    this.state = {
      showNodeSearcher: false,
      nodeToLocate: null,
      nonExistingSearchedNode: null
    };

    this.showMenuOnComponentClicked = this.showMenuOnComponentClicked.bind(this);
    this.showTooltip = this.showTooltip.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
    this.reset = this.reset.bind(this);
    this.showNodeSearcher = this.showNodeSearcher.bind(this);
    this.onNodeSearcherClosed = this.onNodeSearcherClosed.bind(this);
    this.locateNode = this.locateNode.bind(this);
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
    this._container.select('.topology-renderer__canvas__symbol-containers')
      .style('visibility', 'visible');
    this._container.select('.topology-renderer__canvas__known-node-containers')
      .style('visibility', 'hidden');
  }

  private _hideSymbols() {
    this._container.select('.topology-renderer__canvas__symbol-containers')
      .style('visibility', 'hidden');
    this._container.select('.topology-renderer__canvas__known-node-containers')
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
    const nodeRadius = this._isModelLarge() ? 1 : 3;

    this._xScale.domain(
      extent(topology.nodes, (d: Node) => d.x1)
    );
    this._yScale.domain(
      extent(topology.nodes, (d: Node) => d.y1)
    );

    this._resolveSymbolDimensions();

    if (topology.name.includes('9500') && !topology.inverted) {
      topology.inverted = true;
      this._invert9500Model(topology.nodes);
    }

    const categories = this._categorizeNodes(topology.nodes);

    this._container.selectAll('g')
      .remove();

    this._renderEdges(topology.edges);

    if (!this._isModelLarge()) {
      const unknownNodeContainers = select(
        this._createSvgElement(
          'g',
          {
            class: 'topology-renderer__canvas__unknown-node-containers',
            style: 'visibility: visible'
          }
        )
      );
      this._renderNonSwitchNodes(
        unknownNodeContainers,
        'unknown-node-container',
        categories.unknownNodes,
        nodeRadius
      );

      this._container.node()
        .appendChild(unknownNodeContainers.node());
    }

    const nodeContainers = select(
      this._createSvgElement(
        'g',
        {
          class: 'topology-renderer__canvas__known-node-containers',
          style: 'visibility: visible'
        }
      )
    );
    this._renderNonSwitchNodes(
      nodeContainers,
      'remaining-non-switch-node-container',
      categories.remainingNonSwitchNodes,
      nodeRadius
    );
    this._renderNonSwitchNodes(
      nodeContainers,
      'transformer-node-container',
      categories.transformers,
      nodeRadius
    );
    this._renderNonSwitchNodes(
      nodeContainers,
      'capacitor-node-container',
      categories.capacitors,
      nodeRadius
    );
    this._renderSwitchNodes(
      nodeContainers,
      categories.switches,
      nodeRadius
    );

    const symbolContainers = select(
      this._createSvgElement(
        'g',
        {
          class: 'topology-renderer__canvas__symbol-containers',
          style: 'visibility: hidden'
        }
      )
    );
    this._renderCapacitorSymbols(
      symbolContainers,
      categories.capacitors,
      nodeNameToEdgeMap
    );
    this._renderTransformerSymbols(
      symbolContainers,
      categories.transformers,
      nodeNameToEdgeMap
    );
    this._renderRemainingNonSwitchSymbols(
      symbolContainers,
      categories.remainingNonSwitchNodes,
      nodeNameToEdgeMap
    );
    this._renderSwitchSymbols(symbolContainers, categories.switches);

    this._container.node()
      .appendChild(nodeContainers.node());
    this._container.node()
      .appendChild(symbolContainers.node());
  }

  private _isModelLarge() {
    return this.props.topology.nodes.length >= 1000;
  }

  private _resolveSymbolDimensions() {
    if (this._isModelLarge()) {
      this._scalingFactorPerSymbolTable.capacitor = 7;
      this._scalingFactorPerSymbolTable.transformer = 7;
    } else {
      this._scalingFactorPerSymbolTable.capacitor = 3.5;
      this._scalingFactorPerSymbolTable.transformer = 3.5;
    }

    this._symbolDimensions.capacitor.width /= this._scalingFactorPerSymbolTable.capacitor;
    this._symbolDimensions.capacitor.height /= this._scalingFactorPerSymbolTable.capacitor;
    this._symbolDimensions.transformer.width /= this._scalingFactorPerSymbolTable.transformer;
    this._symbolDimensions.transformer.height /= this._scalingFactorPerSymbolTable.transformer;
  }

  private _invert9500Model(nodes: Node[]) {
    const [minYCoordinate, maxYCoordinate] = this._yScale.domain();
    for (const node of nodes) {
      node.y1 = minYCoordinate + (maxYCoordinate - node.y1);
      if ('x2' in node)
        (node as any).y2 = minYCoordinate + (maxYCoordinate - (node as any).y2);
    }
  }

  private _categorizeNodes(nodes: Node[]) {
    const categories = {
      remainingNonSwitchNodes: [] as Node[],
      switches: [] as Switch[],
      capacitors: [] as Capacitor[],
      transformers: [] as Transformer[],
      unknownNodes: [] as Node[]
    };

    for (const node of nodes) {
      node.screenX1 = this._xScale(node.x1);
      node.screenY1 = this._yScale(node.y1);

      switch (node.type) {
        case 'switch':
          (node as Switch).screenX2 = this._xScale((node as Switch).x2);
          (node as Switch).screenY2 = this._yScale((node as Switch).y2);
          (node as Switch).dx = (node as Switch).screenX2 - node.screenX1;
          (node as Switch).dy = (node as Switch).screenY2 - node.screenY1;
          categories.switches.push(node as Switch);
          break;
        case 'capacitor':
          categories.capacitors.push(node as Capacitor);
          break;
        case 'transformer':
          categories.transformers.push(node as Transformer);
          break;
        case 'unknown':
          categories.unknownNodes.push(node);
          break;
        default:
          categories.remainingNonSwitchNodes.push(node);
          break;
      }
    }
    return categories;
  }

  private _renderEdges(edges: Edge[]) {
    const documentFragment = document.createDocumentFragment();
    for (const edgeData of edges) {
      const edge = this._createSvgElement(
        'path',
        {
          class: 'topology-renderer__canvas__edge ' + edgeData.name,
          d: this._edgeGenerator([edgeData.from, edgeData.to])
        }
      );
      documentFragment.appendChild(edge);
    }

    this._container.append('g')
      .attr('class', 'topology-renderer__canvas__edge-container')
      .node()
      .appendChild(documentFragment);
  }

  private _createSvgElement(elementName: string, attrs: { [key: string]: any }): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', elementName);
    for (const attrName in attrs)
      element.setAttribute(attrName, attrs[attrName]);
    return element;
  }

  private _renderNonSwitchNodes(
    container: Selection<SVGElement, any, SVGElement, any>,
    groupId: string,
    nonSwitchNodes: Node[],
    nodeRadius: number
  ) {
    container.append('g')
      .attr('class', groupId)
      .selectAll('circle')
      .data(nonSwitchNodes)
      .enter()
      .append('circle')
      .attr('class', `topology-renderer__canvas__node ${nonSwitchNodes[0].type}`)
      .attr('cx', node => node.screenX1)
      .attr('cy', node => node.screenY1)
      .attr('r', nodeRadius);
  }

  private _renderSwitchNodes(
    container: Selection<SVGElement, any, SVGElement, any>,
    switchNodes: Switch[],
    nodeRadius: number
  ) {
    const switches = container.append('g')
      .attr('class', 'switch-node-container')
      .selectAll('.topology-renderer__canvas__switch-node')
      .data(switchNodes)
      .enter()
      .append('g')
      .attr('class', 'topology-renderer__canvas__switch-node');

    switches.append('line')
      .attr('x1', node => node.screenX1)
      .attr('y1', node => node.screenY1)
      .attr('x2', node => node.screenX2)
      .attr('y2', node => node.screenY2)
      .attr('class', 'topology-renderer__canvas__edge')
      .attr('stroke-width', '0.2');

    switches.append('circle')
      .attr('class', node => `topology-renderer__canvas__node switch _${node.name}_`)
      .attr('cx', node => (node.screenX1 + node.screenX2) / 2)
      .attr('cy', node => (node.screenY1 + node.screenY2) / 2)
      .attr('r', nodeRadius)
      .attr('fill', '#000');
  }

  private _renderRemainingNonSwitchSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    remainingNonSwitchNodes: Node[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    container.append('g')
      .attr('class', 'remaining-non-switch-symbol-container')
      .selectAll('foreignObject.topology-renderer__canvas__symbol')
      .data(remainingNonSwitchNodes)
      .enter()
      .append('foreignObject')
      .attr('class', node => `topology-renderer__canvas__symbol${node.type ? ' ' + node.type : ''}`)
      .attr('width', node => this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].width : this._symbolSize)
      .attr('height', node => this._symbolDimensions[node.type] ? this._symbolDimensions[node.type].height : this._symbolSize)
      .attr('x', node => node.screenX1)
      .attr('y', node => node.screenY1)
      .style('transform-origin', node => this._calculateSymbolTransformOrigin(node))
      .style('transform', node => this._calculateSymbolTransform(node, nodeNameToEdgeMap))
      .append('xhtml:div')
      .attr('class', 'topology-renderer__canvas__symbol__image');
  }

  private _renderCapacitorSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    capacitors: Capacitor[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions.capacitor;
    const _45PercentWidth = width * 0.45;
    const _10PercentWidth = width * 0.10;
    const _50PercentHeight = height * 0.5;

    container.append('g')
      .attr('class', 'capacitor-symbol-container')
      .selectAll('.topology-renderer__canvas__symbol.capacitor')
      .data(capacitors)
      .enter()
      .append('g')
      .style('transform-origin', node => this._calculateSymbolTransformOrigin(node))
      .style('transform', node => this._calculateSymbolTransform(node, nodeNameToEdgeMap))
      .attr('class', 'topology-renderer__canvas__symbol capacitor')
      .append('path')
      .attr('class', 'topology-renderer__canvas__symbol capacitor')
      .attr('stroke-width', this._isModelLarge() ? 0.3 : 0.6)
      .attr('class', 'topology-renderer__canvas__symbol capacitor')
      .attr('d', node => {
        return `
          M${node.screenX1},${node.screenY1}
          h${_45PercentWidth}
          m0,${-_50PercentHeight}
          v${height}
          m${_10PercentWidth},0
          v${-height}
          m0,${_50PercentHeight}
          h${_45PercentWidth}`;
      });
  }

  private _calculateSymbolTransformOrigin(node: Node) {
    const width = this._symbolDimensions[node.type]?.width || this._symbolSize;
    const height = this._symbolDimensions[node.type]?.height || this._symbolSize;
    const verticalOffset = node.type === 'capacitor' ? -height / 2 : 0;
    return `${node.screenX1 + (width / 2)}px ${node.screenY1 + verticalOffset + (height / 2)}px`;
  }

  private _calculateSymbolTransform(node: Node, nodeNameToEdgeMap: Map<string, Edge>) {
    const edge = nodeNameToEdgeMap.get((node as any).from) || nodeNameToEdgeMap.get((node as any).to);
    if (!edge && node.type === 'capacitor') {
      return 'translate(0, 0) rotate(0)';
    }
    const width = this._symbolDimensions[node.type]?.width || this._symbolSize;
    const height = this._symbolDimensions[node.type]?.height || this._symbolSize;
    const angle = !edge ? 0 : this._calculateAngleBetweenLineAndXAxis(edge.from.x1, edge.from.y1, edge.to.x1, edge.to.y1);
    return `translate(-${width / 2}px, -${height / 2}px) rotate(${angle}deg)`;
  }

  private _calculateAngleBetweenLineAndXAxis(x1: number, y1: number, x2: number, y2: number) {
    const horizontal = x2 - x1;
    const vertical = y2 - y1;
    return Math.atan(vertical / horizontal) * 180 / Math.PI;
  }

  private _renderTransformerSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    transformers: Transformer[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions.transformer;
    const arcRadius = width * 0.1;
    const arcEndpoint = `0,${height * 0.25}`;
    const halfOf45PercentWidth = width * 0.45 * 0.50;
    const _12Point5PercentHeight = height * 0.125;
    const _80PercentWidth = width * 0.8;

    container.append('g')
      .attr('class', 'transformer-symbol-container')
      .selectAll('.topology-renderer__canvas__symbol.transformer')
      .data(transformers)
      .enter()
      .append('g')
      .attr('class', 'topology-renderer__canvas__symbol transformer')
      .style('transform-origin', transformer => this._calculateSymbolTransformOrigin(transformer))
      .style('transform', transformer => this._calculateSymbolTransform(transformer, nodeNameToEdgeMap))
      .append('path')
      .attr('stroke-width', this._isModelLarge() ? 0.3 : 0.6)
      .attr('class', 'topology-renderer__canvas__symbol transformer')
      .attr('d', transformer => {
        return `
          M${transformer.screenX1},${transformer.screenY1}
          h${halfOf45PercentWidth}
          v${_12Point5PercentHeight}
          a${arcRadius} ${arcRadius} 0 1 1 ${arcEndpoint}
          a${arcRadius} ${arcRadius} 0 1 1 ${arcEndpoint}
          a${arcRadius} ${arcRadius} 0 1 1 ${arcEndpoint}
          v${_12Point5PercentHeight}
          h${-halfOf45PercentWidth}

          m${_80PercentWidth},${-height}
          h${-halfOf45PercentWidth}
          v${_12Point5PercentHeight}
          a${arcRadius} ${arcRadius} 0 1 0 ${arcEndpoint}
          a${arcRadius} ${arcRadius} 0 1 0 ${arcEndpoint}
          a${arcRadius} ${arcRadius} 0 1 0 ${arcEndpoint}
          v${_12Point5PercentHeight}
          h${halfOf45PercentWidth}`;
      });
  }

  private _renderSwitchSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    switchNodes: Switch[]
  ) {
    if (this._isModelLarge()) {
      this._symbolDimensions.switch.width = 3;
      this._symbolDimensions.switch.height = 3;
    }
    const width = this._symbolDimensions.switch.width;
    const height = this._symbolDimensions.switch.height;

    const switches = container.append('g')
      .attr('class', 'switch-symbol-container')
      .selectAll('.topology-renderer__canvas__symbol.switch')
      .data(switchNodes)
      .enter()
      .append('g')
      .attr('class', 'topology-renderer__canvas__symbol switch')
      .attr('transform', node => `translate(${node.screenX1},${node.screenY1})`);

    switches.append('line')
      .attr('class', 'topology-renderer__canvas__edge')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', node => node.dx)
      .attr('y2', node => node.dy)
      .attr('stroke-width', '0.2')
      .attr('stroke', '#000');

    switches.append('rect')
      .attr('class', 'topology-renderer__canvas__symbol switch')
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
          className={`topology-renderer__canvas ${this.props.topology.name}`}
          onClick={this.showMenuOnComponentClicked}
          onMouseOver={this.showTooltip}
          onMouseOut={this.hideTooltip}>
          <g className='topology-renderer__canvas__container' />
        </svg>
        <div className='topology-renderer__toolbox-container'>
          <div className='topology-renderer__toolbox'>
            <Tooltip content='Reset'>
              <IconButton
                icon='refresh'
                size='small'
                style='accent'
                onClick={this.reset} />
            </Tooltip>
          </div>
          <div className='topology-renderer__toolbox'>
            <Tooltip content='Search for nodes by name or MRID'>
              <IconButton
                icon='search'
                size='small'
                style='accent'
                onClick={this.showNodeSearcher} />
            </Tooltip>
          </div>
        </div>
        <NodeSearcher
          show={this.state.showNodeSearcher}
          nodes={this.props.topology ? this.props.topology.nodes : []}
          onClose={this.onNodeSearcherClosed}
          onNodeSelected={this.locateNode} />
        {
          this.state.nodeToLocate
          &&
          <MatchedNodeLocator
            node={this.state.nodeToLocate}
            onDimissed={() => this.setState({ nodeToLocate: null })} />
        }
        {
          this.state.nonExistingSearchedNode
          &&
          <NotificationBanner onHide={() => this.setState({ nonExistingSearchedNode: null })}>
            Unable to locate node&nbsp;
            <span className='topology-renderer__non-existing-searched-node'>{this.state.nonExistingSearchedNode.name}</span>
          </NotificationBanner>
        }
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
          this._toggleSwitch(open, swjtch);
        }} />
    );
  }

  private _toggleSwitch(open: boolean, swjtch: Switch) {
    if (swjtch.open !== open)
      this.props.onToggleSwitch(swjtch, open);
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
    this._tooltip?.hide();
    this._tooltip = null;
  }

  reset() {
    this._zoomer.transform(this._canvas.transition(), zoomIdentity);
  }

  showNodeSearcher() {
    this.setState({
      showNodeSearcher: true
    });
  }

  onNodeSearcherClosed() {
    this.setState({
      showNodeSearcher: false
    });
  }

  locateNode(node: Node) {
    let currentTransform = zoomTransform(this._canvas.node());
    let currentZoom = 1;
    if (currentTransform.k < 3) {
      // Zoom in 3 degrees
      currentZoom = this._isModelLarge() ? 6 : 3;
      currentTransform = currentTransform.scale((1 / currentTransform.k) * currentZoom);
    } else {
      currentZoom = currentTransform.k;
    }
    this._zoomer.transform(this._canvas, currentTransform);

    // Reset the zoom level to 1
    currentTransform = currentTransform.scale(1 / currentZoom);

    const canvasBoundingBox = this.svg.getBoundingClientRect();
    const elementForNode = document.querySelector(`.topology-renderer__canvas__node.${node.type}._${node.name}_`) as SVGCircleElement;
    if (elementForNode) {
      const nodeBoundingBox = elementForNode.getBoundingClientRect();
      const centerX = (canvasBoundingBox.left + (this.svg.clientWidth / 2)) - nodeBoundingBox.left;
      const centerY = (canvasBoundingBox.top + (this.svg.clientHeight / 2)) - nodeBoundingBox.top;

      currentTransform = currentTransform.translate(centerX, centerY);
      currentTransform = currentTransform.scale(currentZoom);
      const transformTransition = this._canvas.transition()
        .on('end', () => {
          this.setState({
            nodeToLocate: elementForNode
          });
        });
      this._zoomer.transform(transformTransition, currentTransform);
      return true;
    } else {
      this.setState({
        nonExistingSearchedNode: node
      });
      return false;
    }

  }

}
