import * as React from 'react';
import { extent } from 'd3-array';
import { line } from 'd3-shape';
import { select, Selection, create } from 'd3-selection';
import { scaleLinear, ScaleLinear, selectAll } from 'd3';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { CanvasTransformService } from '@shared/CanvasTransformService';
import { Switch, Capacitor, Node, Edge, Regulator, Transformer, ConductingEquipmentType, ModelDictionaryMeasurementType } from '@shared/topology';
import { Tooltip } from '@shared/tooltip';
import { SwitchControlMenu } from './views/switch-control-menu/SwitchControlMenu';
import { CapacitorControlMenu } from './views/capacitor-control-menu/CapacitorControlMenu';
import { RegulatorControlMenu } from './views/regulator-control-menu/RegulatorControlMenu';
import { RenderableTopology } from './models/RenderableTopology';
import { IconButton } from '@shared/buttons';
import { NodeSearcher } from './views/node-searcher/NodeSearcher';
import { MatchedNodeLocator } from './views/matched-node-locator/MatchedNodeLocator';
import { showNotification } from '@shared/overlay/notification';
import { StateStore } from '@shared/state-store';
import { PortalRenderer } from '@shared/overlay/portal-renderer';
import { SimulationOutputMeasurement } from '@shared/simulation';

import './TopologyRenderer.light.scss';
import './TopologyRenderer.dark.scss';

interface Props {
  topology: RenderableTopology;
  simulationOutputMeasurements: SimulationOutputMeasurement[];
  onToggleSwitch: (swjtch: Switch, open: boolean) => void;
  onCapacitorControlMenuFormSubmitted: (currentCapacitor: Capacitor, updatedCapacitor: Capacitor) => void;
  onRegulatorControlMenuFormSubmitted: (currentRegulator: Regulator, newRegulator: Regulator) => void;
}

interface State {
  showNodeSearcher: boolean;
  nodeToLocate: SVGCircleElement;
}

const symbolSize = 35;

export class TopologyRenderer extends React.Component<Props, State> {

  readonly canvasTransformService = CanvasTransformService.getInstance();
  readonly svgRef = React.createRef<SVGSVGElement>();


  private readonly _scalingFactorPerSymbolTable = {
    capacitor: 1,
    regulator: 1,
    transformer: 1,
    switch: 1,
    substation: 1
  };
  private readonly _symbolDimensions = {
    capacitor: { width: 52, height: 20 },
    regulator: { width: 45, height: 5 },
    transformer: { width: 30, height: 25 },
    switch: { width: 10, height: 10 },
    substation: { width: 15, height: 15 }
  };
  private readonly _xScale: ScaleLinear<number, number> = scaleLinear();
  private readonly _yScale: ScaleLinear<number, number> = scaleLinear();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();
  private readonly _elementsToToggleDuringSimulation = new Map<string, Element>();

  private _svgSelection: Selection<SVGElement, any, any, any> = null;
  private _containerSelection: Selection<SVGElement, any, any, any> = null;
  private _showNodeSymbols = false;
  private _tooltip: Tooltip;
  private _timer: any;
  private _switches: Switch[];

  constructor(props: Props) {
    super(props);

    this.state = {
      showNodeSearcher: false,
      nodeToLocate: null
    };

    this.showMenuOnComponentClicked = this.showMenuOnComponentClicked.bind(this);
    this.showTooltip = this.showTooltip.bind(this);
    this.hideTooltip = this.hideTooltip.bind(this);
    this.showNodeSearcher = this.showNodeSearcher.bind(this);
    this.onNodeSearcherClosed = this.onNodeSearcherClosed.bind(this);
    this.locateNode = this.locateNode.bind(this);

    this._calculateSymbolTransformOrigin = this._calculateSymbolTransformOrigin.bind(this);
  }

  componentWillUnmount() {
    this.hideTooltip();
    this._unsubscriber.next();
    this._unsubscriber.complete();
    this._stateStore.update({
      nodeNameToLocate: ''
    });
  }

  shouldComponentUpdate(nextProps: Props) {
    if (this.props.simulationOutputMeasurements !== nextProps.simulationOutputMeasurements) {
      for (const measurement of nextProps.simulationOutputMeasurements) {
        this._toggleSwitchesBasedOnSimulationOutputMeasurement(measurement);
        this._toggleACLineSegmentsWithNoPower(measurement);
      }
      return false;
    }
    return true;
  }

  private _toggleSwitchesBasedOnSimulationOutputMeasurement(measurement: SimulationOutputMeasurement) {
    for (const swjtch of this._switches) {
      if (measurement.conductingEquipmentMRID === swjtch.mRIDs[0] && measurement.type === ModelDictionaryMeasurementType.TAP) {
        swjtch.open = measurement.value === 0;
        const switchNodeKey = `node-switch-${swjtch.name}`;
        const switchSymbolKey = `symbol-switch-${swjtch.name}`;
        if (!this._elementsToToggleDuringSimulation.has(switchNodeKey)) {
          this._elementsToToggleDuringSimulation.set(
            switchNodeKey,
            this.svgRef.current.querySelector(`.topology-renderer__canvas__node.switch._${swjtch.name}_`)
          );
          this._elementsToToggleDuringSimulation.set(
            switchSymbolKey,
            this.svgRef.current.querySelector(`.topology-renderer__canvas__symbol.switch._${swjtch.name}_`)
          );
        }
        const selections = selectAll([
          this._elementsToToggleDuringSimulation.get(switchNodeKey),
          this._elementsToToggleDuringSimulation.get(switchSymbolKey)
        ]);
        if (swjtch.open) {
          selections.classed('closed', false);
          selections.classed('open', true);
        } else {
          selections.classed('closed', true);
          selections.classed('open', false);
        }
      }
    }
  }

  private _toggleACLineSegmentsWithNoPower(measurement: SimulationOutputMeasurement) {
    if (measurement.conductingEquipmentType === ConductingEquipmentType.ACLineSegment) {
      const edge = this.props.topology.edges.find(e => e.name === measurement.conductingEquipmentName);
      if (edge) {
        const fromNodeKey = `node-${edge.from.type}-${edge.from.name}`;
        const fromSymbolKey = `symbol-${edge.from.type}-${edge.from.name}`;
        const toNodeKey = `node-${edge.to.type}-${edge.to.name}`;
        const toSymbolKey = `symbol-${edge.to.type}-${edge.to.name}`;
        const nodeColocatedWithFromNodeKey = `node-${edge.from.x1}-${edge.from.y1}`;
        const symbolColocatedWithFromNodeKey = `symbol-${edge.from.x1}-${edge.from.y1}`;
        const nodeColocatedWithToNodeKey = `node-${edge.to.x1}-${edge.to.y1}`;
        const symbolColocatedWithToNodeKey = `symbol-${edge.to.x1}-${edge.to.y1}`;
        if (!this._elementsToToggleDuringSimulation.has(edge.name)) {
          this._elementsToToggleDuringSimulation.set(
            edge.name,
            this.svgRef.current.querySelector(`.topology-renderer__canvas__edge._${edge.name}_`)
          );
          this._elementsToToggleDuringSimulation.set(
            fromNodeKey,
            this.svgRef.current.querySelector(`.topology-renderer__canvas__node.${edge.from.type}._${edge.from.name}_`)
          );
          this._elementsToToggleDuringSimulation.set(
            fromSymbolKey,
            this.svgRef.current.querySelector(`.topology-renderer__canvas__symbol.${edge.from.type}._${edge.from.name}_`)
          );
          this._elementsToToggleDuringSimulation.set(
            toNodeKey,
            this.svgRef.current.querySelector(`.topology-renderer__canvas__node.${edge.to.type}._${edge.to.name}_`)
          );
          this._elementsToToggleDuringSimulation.set(
            toSymbolKey,
            this.svgRef.current.querySelector(`.topology-renderer__canvas__symbol.${edge.to.type}._${edge.to.name}_`)
          );
          this._elementsToToggleDuringSimulation.set(
            nodeColocatedWithFromNodeKey,
            this.svgRef.current.querySelector(`.topology-renderer__canvas__symbol.${edge.to.type}._${edge.to.name}_`)
          );
          this._locateNodesAtLocation(edge.from.x1, edge.from.y1);
          this._locateNodesAtLocation(edge.to.x1, edge.to.y1);
        }
        const selections = selectAll([
          this._elementsToToggleDuringSimulation.get(edge.name),
          this._elementsToToggleDuringSimulation.get(fromNodeKey),
          this._elementsToToggleDuringSimulation.get(fromSymbolKey),
          this._elementsToToggleDuringSimulation.get(toNodeKey),
          this._elementsToToggleDuringSimulation.get(toSymbolKey),
          this._elementsToToggleDuringSimulation.get(nodeColocatedWithFromNodeKey),
          this._elementsToToggleDuringSimulation.get(symbolColocatedWithFromNodeKey),
          this._elementsToToggleDuringSimulation.get(nodeColocatedWithToNodeKey),
          this._elementsToToggleDuringSimulation.get(symbolColocatedWithToNodeKey)
        ]);
        if (-0.3 <= measurement.magnitude && measurement.magnitude <= 0.3) {
          selections.classed('no-power', true);
        } else {
          selections.classed('no-power', false);
        }
      }
    }
  }

  private _locateNodesAtLocation(x: number, y: number) {
    const foundNodes = this.props.topology.nodes.filter(
      node => node.type !== 'unknown' && node.x1 === x && node.y1 === y
    );
    const foundNode = foundNodes[foundNodes.length - 1];
    if (foundNode) {
      const nodeKey = `node-${x}-${y}`;
      const symbolKey = `symbol-${x}-${y}`;
      this._elementsToToggleDuringSimulation.set(
        nodeKey,
        this.svgRef.current.querySelector(`.topology-renderer__canvas__node.${foundNode.type}._${foundNode.name}_`)
      );
      this._elementsToToggleDuringSimulation.set(
        symbolKey,
        this.svgRef.current.querySelector(`.topology-renderer__canvas__symbol.${foundNode.type}._${foundNode.name}_`)
      );
    }
  }

  componentDidMount() {
    const canvasBoundingBox = this.svgRef.current.getBoundingClientRect();
    const spacing = 10;
    this.svgRef.current.setAttribute('width', String(canvasBoundingBox.width));
    this.svgRef.current.setAttribute('height', String(canvasBoundingBox.height));
    this.svgRef.current.setAttribute('viewBox', `0 0 ${canvasBoundingBox.width} ${canvasBoundingBox.height}`);
    this._xScale.range([spacing, canvasBoundingBox.width - spacing]);
    this._yScale.range([spacing, canvasBoundingBox.height - spacing]);
    this._svgSelection = this.canvasTransformService.bindToSvgCanvas(this.svgRef.current);
    this._containerSelection = this._svgSelection.select<SVGGElement>('.topology-renderer__canvas__container');
    this.canvasTransformService.onTransformed()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: currentTransform => {
          this._containerSelection.attr('transform', currentTransform.toString());
          this._toggleNodeSymbols(currentTransform.k);
        }
      });
    this._stateStore.select('nodeNameToLocate')
      .pipe(
        takeUntil(this._unsubscriber),
        filter(nodeName => nodeName !== '')
      )
      .subscribe({
        next: nodeName => {
          const foundNode = this.props.topology.nodes.find(node => node.name === nodeName);
          if (foundNode) {
            this.locateNode(foundNode);
          } else {
            showNotification(
              <>
                Unable to locate node &nbsp;
                <span className='topology-renderer__non-existing-searched-node'>
                  {nodeName}
                </span>
                &nbsp; in the model
              </>
            );
          }
        }
      });
  }

  private _toggleNodeSymbols(currentTransformScaleDegree: number) {
    if (this.props.topology.nodes.length <= 200) {
      if (currentTransformScaleDegree > 1.5 && !this._showNodeSymbols) {
        this._showNodeSymbols = true;
        this._showSymbols();
      } else if (currentTransformScaleDegree < 1.5 && this._showNodeSymbols) {
        this._showNodeSymbols = false;
        this._hideSymbols();
      }
    } else if (this.props.topology.nodes.length > 200) {
      if (currentTransformScaleDegree > 2.5 && !this._showNodeSymbols) {
        this._showNodeSymbols = true;
        this._showSymbols();
      } else if (currentTransformScaleDegree < 2.5 && this._showNodeSymbols) {
        this._showNodeSymbols = false;
        this._hideSymbols();
      }
    }
  }

  private _showSymbols() {
    this._containerSelection.select('.topology-renderer__canvas__symbol-containers')
      .style('visibility', 'visible');
    this._containerSelection.select('.topology-renderer__canvas__known-node-containers')
      .style('visibility', 'hidden');
  }

  private _hideSymbols() {
    this._containerSelection.select('.topology-renderer__canvas__symbol-containers')
      .style('visibility', 'hidden');
    this._containerSelection.select('.topology-renderer__canvas__known-node-containers')
      .style('visibility', 'visible');
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.topology !== prevProps.topology) {
      this._elementsToToggleDuringSimulation.clear();
      this._render();
    }
  }

  private _render() {
    const topology = this.props.topology;
    const nodeNameToEdgeMap = topology.edges.reduce((map, edge) => {
      map.set(edge.from.name, edge);
      map.set(edge.to.name, edge);
      return map;
    }, new Map<string, Edge>());
    const nodeRadius = this.isModelLarge() ? 1 : 3;

    this._xScale.domain(extent(topology.nodes, (d: Node) => d.x1));
    this._yScale.domain(extent(topology.nodes, (d: Node) => d.y1));

    this._resolveSymbolDimensions();

    if (topology.name.includes('9500') && !topology.inverted) {
      topology.inverted = true;
      this._invert9500Model(topology.nodes);
    }

    const categories = this._categorizeNodes(topology.nodes);

    this._containerSelection.selectAll('g').remove();

    this._renderEdges(topology.edges);

    if (!this.isModelLarge()) {
      const container = create('svg:g') as Selection<SVGElement, any, SVGElement, any>;
      this._renderNonSwitchNodes(
        container,
        'topology-renderer__canvas__unknown-node-container',
        categories.unknownNodes,
        nodeRadius
      );
      const unknownNodeContainer = container.select(':first-child')
        .attr('style', 'visibility: visible') as Selection<SVGElement, any, SVGElement, any>;
      this._containerSelection.node()
        .appendChild(unknownNodeContainer.node());
    }

    const knownNodeContainers = create('svg:g')
      .attr('class', 'topology-renderer__canvas__known-node-containers')
      .attr('style', 'visibility: visible') as Selection<SVGElement, any, SVGElement, any>;
    this._renderNonSwitchNodes(
      knownNodeContainers,
      'remaining-non-switch-node-container',
      categories.otherNodes,
      nodeRadius
    );
    this._renderNonSwitchNodes(
      knownNodeContainers,
      'regulator-node-container',
      categories.regulators,
      nodeRadius
    );
    this._renderNonSwitchNodes(
      knownNodeContainers,
      'substation-node-container',
      categories.substations,
      nodeRadius
    );
    this._renderNonSwitchNodes(
      knownNodeContainers,
      'transformer-node-container',
      categories.transformers,
      nodeRadius
    );
    this._renderNonSwitchNodes(
      knownNodeContainers,
      'capacitor-node-container',
      categories.capacitors,
      nodeRadius
    );
    this._renderSwitchNodes(
      knownNodeContainers,
      categories.switches,
      nodeRadius
    );

    const symbolContainers = create('svg:g')
      .attr('class', 'topology-renderer__canvas__symbol-containers')
      .attr('style', 'visibility: hidden') as Selection<SVGElement, any, SVGElement, any>;
    this._renderRegulatorSymbols(
      symbolContainers,
      categories.regulators,
      nodeNameToEdgeMap
    );
    this._renderSubstationSymbols(
      symbolContainers,
      categories.substations,
      nodeNameToEdgeMap
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
    this._renderSwitchSymbols(symbolContainers, categories.switches);

    this._containerSelection.node()
      .appendChild(knownNodeContainers.node());
    this._containerSelection.node()
      .appendChild(symbolContainers.node());
  }

  isModelLarge() {
    return this.props.topology.nodes.length >= 1000;
  }

  private _resolveSymbolDimensions() {
    if (this.isModelLarge()) {
      this._scalingFactorPerSymbolTable.capacitor = 7;
      this._scalingFactorPerSymbolTable.transformer = 7;
      this._scalingFactorPerSymbolTable.regulator = 7;
      this._scalingFactorPerSymbolTable.substation = 7;
    } else {
      this._scalingFactorPerSymbolTable.capacitor = 3.5;
      this._scalingFactorPerSymbolTable.transformer = 3.5;
      this._scalingFactorPerSymbolTable.regulator = 3.5;
      this._scalingFactorPerSymbolTable.substation = 3.5;
    }

    for (const [type, scalingFactor] of Object.entries(this._scalingFactorPerSymbolTable)) {
      this._symbolDimensions[type].width /= scalingFactor;
      this._symbolDimensions[type].height /= scalingFactor;
    }
  }

  private _invert9500Model(nodes: Node[]) {
    const [minYCoordinate, maxYCoordinate] = this._yScale.domain();
    for (const node of nodes) {
      node.y1 = minYCoordinate + (maxYCoordinate - node.y1);
      if ('y2' in node) {
        (node as any).y2 = minYCoordinate + (maxYCoordinate - (node as any).y2);
      }
    }
  }

  private _categorizeNodes(nodes: Node[]) {
    const categories = {
      otherNodes: [] as Node[],
      switches: [] as Switch[],
      capacitors: [] as Capacitor[],
      transformers: [] as Transformer[],
      unknownNodes: [] as Node[],
      regulators: [] as Regulator[],
      substations: [] as Node[]
    };

    for (const node of nodes) {
      node.screenX1 = this._xScale(node.x1);
      node.screenY1 = this._yScale(node.y1);

      switch (node.type) {
        case 'switch':
          (node as Switch).screenX2 = this._xScale((node as Switch).x2);
          (node as Switch).screenY2 = this._yScale((node as Switch).y2);
          (node as Switch).midpointX = (node.screenX1 + (node as Switch).screenX2) / 2;
          (node as Switch).midpointY = (node.screenY1 + (node as Switch).screenY2) / 2;
          categories.switches.push(node as Switch);
          break;
        case 'capacitor':
          categories.capacitors.push(node as Capacitor);
          break;
        case 'transformer':
          categories.transformers.push(node as Transformer);
          break;
        case 'regulator':
          categories.regulators.push(node as Regulator);
          break;
        case 'unknown':
          categories.unknownNodes.push(node);
          break;
        case 'substation':
          categories.substations.push(node);
          break;
        default:
          categories.otherNodes.push(node);
          break;
      }
    }
    this._switches = categories.switches;
    return categories;
  }

  private _renderEdges(edges: Edge[]) {
    const documentFragment = document.createDocumentFragment();
    const edgeGenerator = line<Node>()
      .x(node => node.screenX1)
      .y(node => node.screenY1);
    for (const datum of edges) {
      const edge = create('svg:path').node();
      edge.setAttribute('class', `topology-renderer__canvas__edge _${datum.name}_`);
      edge.setAttribute('d', edgeGenerator([datum.from, datum.to]));
      documentFragment.appendChild(edge);
    }

    this._containerSelection.append('g')
      .attr('class', 'topology-renderer__canvas__edge-container')
      .node()
      .appendChild(documentFragment);
  }

  private _renderNonSwitchNodes(
    container: Selection<SVGElement, any, SVGElement, any>,
    groupId: string,
    nonSwitchNodes: Node[],
    nodeRadius: number
  ) {
    const documentFragment = document.createDocumentFragment();
    for (const datum of nonSwitchNodes) {
      const circle = create('svg:circle').datum(datum).node();
      circle.setAttribute('class', `topology-renderer__canvas__node ${datum.type} _${datum.name}_`);
      circle.setAttribute('cx', String(datum.screenX1));
      circle.setAttribute('cy', String(datum.screenY1));
      circle.setAttribute('r', String(nodeRadius));
      documentFragment.appendChild(circle);
    }
    const group = container.append('g').attr('class', groupId);
    group.node().appendChild(documentFragment);
  }

  private _renderSwitchNodes(
    container: Selection<SVGElement, any, SVGElement, any>,
    switchNodes: Switch[],
    nodeRadius: number
  ) {
    const fragment = document.createDocumentFragment();
    for (const datum of switchNodes) {
      const switchNode = create('svg:g').attr('class', 'topology-renderer__canvas__switch-node');
      const lineSegment = switchNode.append('line').node();
      lineSegment.setAttribute('x1', String(datum.screenX1));
      lineSegment.setAttribute('y1', String(datum.screenY1));
      lineSegment.setAttribute('x2', String(datum.screenX2));
      lineSegment.setAttribute('y2', String(datum.screenY2));
      lineSegment.setAttribute('class', 'topology-renderer__canvas__edge');
      lineSegment.setAttribute('stroke-width', '0.2');

      const circle = switchNode.append('circle').datum(datum).node();
      circle.setAttribute('class', `topology-renderer__canvas__node switch _${datum.name}_`);
      circle.setAttribute('cx', String(datum.midpointX));
      circle.setAttribute('cy', String(datum.midpointY));
      circle.setAttribute('r', String(nodeRadius));
      circle.setAttribute('fill', '#000');
      fragment.appendChild(switchNode.node());
    }
    const group = container.append('g').attr('class', 'switch-node-container');
    group.node().appendChild(fragment);
  }

  private _calculateSymbolTransformOrigin(node: Node) {
    const width = this._symbolDimensions[node.type]?.width || symbolSize;
    const height = this._symbolDimensions[node.type]?.height || symbolSize;
    if (node.type === 'capacitor' || node.type === 'regulator') {
      return `${node.screenX1 + (width / 2)}px ${node.screenY1}px`;
    }
    return `${node.screenX1 + (width / 2)}px ${node.screenY1 + (height / 2)}px`;
  }

  private _calculateSymbolTransform(node: Node, nodeNameToEdgeMap: Map<string, Edge>) {
    const edge = nodeNameToEdgeMap.get((node as any).from) || nodeNameToEdgeMap.get((node as any).to);
    if (!edge && node.type === 'capacitor') {
      return 'translate(0, 0) rotate(0)';
    }
    const width = this._symbolDimensions[node.type]?.width || symbolSize;
    const height = this._symbolDimensions[node.type]?.height || symbolSize;
    const angle = !edge ? 0 : this._calculateAngleBetweenLineAndXAxis(edge.from.x1, edge.from.y1, edge.to.x1, edge.to.y1);
    switch (node.type) {
      case 'regulator':
      case 'capacitor':
      case 'substation':
        return `translate(-${width / 2}px, 0px) rotate(${angle}deg)`;
      default:
        return `translate(-${width / 2}px, -${height / 2}px) rotate(${angle}deg)`;
    }
  }

  private _calculateAngleBetweenLineAndXAxis(x1: number, y1: number, x2: number, y2: number) {
    const horizontal = x2 - x1;
    const vertical = y2 - y1;
    return (Math.atan(vertical / horizontal) * 180 / Math.PI) || 0;
  }

  private _renderSubstationSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    substations: Node[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions.substation;
    const _50PercentHeight = height / 2;

    this._renderNonSwitchSymbols(
      container,
      substations,
      nodeNameToEdgeMap,
      `M\${startingPoint}
       a${_50PercentHeight} ${_50PercentHeight} 0 1 1 ${width} 0
       a${_50PercentHeight} ${_50PercentHeight} 0 1 1 -${width} 0`
    );
  }

  private _renderNonSwitchSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    nodes: Node[],
    nodeNameToEdgeMap: Map<string, Edge>,
    shapeTemplate: string
  ) {
    if (nodes.length > 0) {
      if (!shapeTemplate.includes('${startingPoint}')) {
        throw new Error(`Symbol's path template must contain \${startingPoint} place holder`);
      }
      const nodeType = nodes[0]?.type;
      const fragment = document.createDocumentFragment();
      for (const datum of nodes) {
        const symbol = create('svg:g');
        symbol.attr('class', `topology-renderer__canvas__symbol ${nodeType}`)
          .style('transform-origin', this._calculateSymbolTransformOrigin(datum))
          .style('transform', this._calculateSymbolTransform(datum, nodeNameToEdgeMap))
          .append('path')
          .datum(datum)
          .attr('class', `topology-renderer__canvas__symbol ${nodeType} _${datum.name}_`)
          .attr('d', shapeTemplate.replace('${startingPoint}', `${datum.screenX1},${datum.screenY1}`));
        fragment.appendChild(symbol.node());
      }

      const group = container.append('g').attr('class', `${nodeType}-symbol-container`);
      group.node().appendChild(fragment);
    }
  }

  private _renderRegulatorSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    regulators: Regulator[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions.regulator;
    const _25PercentWidth = width * 0.25;
    const _30PercentWidth = width * 0.30;
    const _50PercentWidth = width / 2;
    const _50PercentHeight = height / 2;
    const _170PercentHeight = height * 1.70; // Not sure why, but this number makes this symbol looks good

    this._renderNonSwitchSymbols(
      container,
      regulators,
      nodeNameToEdgeMap,
      `
        M\${startingPoint}
        h${_25PercentWidth}
        a${_50PercentHeight} ${_50PercentHeight} 0 1 1 ${_30PercentWidth} 0
        a${_50PercentHeight} ${_50PercentHeight} 0 1 1 -${_30PercentWidth} 0
        m${_50PercentWidth},0
        a${_50PercentHeight} ${_50PercentHeight} 0 1 0 -${_30PercentWidth} 0
        a${_50PercentHeight} ${_50PercentHeight} 0 1 0 ${_30PercentWidth} 0
        h${_25PercentWidth}
        m-${_50PercentWidth},-${_170PercentHeight}
        l${_25PercentWidth},${2 * (_170PercentHeight)}
      `
    );
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

    this._renderNonSwitchSymbols(
      container,
      capacitors,
      nodeNameToEdgeMap,
      `
        M\${startingPoint}
        h${_45PercentWidth}
        m0,${-_50PercentHeight}
        v${height}
        m${_10PercentWidth},0
        v${-height}
        m0,${_50PercentHeight}
        h${_45PercentWidth}
      `
    );
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

    this._renderNonSwitchSymbols(
      container,
      transformers,
      nodeNameToEdgeMap,
      `
        M\${startingPoint}
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
        h${halfOf45PercentWidth}
      `
    );
  }

  private _renderSwitchSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    switchNodes: Switch[]
  ) {
    if (this.isModelLarge()) {
      this._symbolDimensions.switch.width = 3;
      this._symbolDimensions.switch.height = 3;
    }
    const width = this._symbolDimensions.switch.width;
    const height = this._symbolDimensions.switch.height;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const fragment = document.createDocumentFragment();

    for (const datum of switchNodes) {
      let transformValue = 'rotate(0) translate(0, 0)';
      if (datum.from && datum.to) {
        const angle = this._calculateAngleBetweenLineAndXAxis(
          datum.screenX1,
          datum.screenY1,
          datum.screenX2,
          datum.screenY2
        );
        transformValue = `rotate(${angle},${datum.midpointX},${datum.midpointY})`;
      }
      const symbol = create('svg:g').attr('class', 'topology-renderer__canvas__switch-symbol');

      const lineSegment = symbol.append('line').node();
      lineSegment.setAttribute('class', 'topology-renderer__canvas__edge');
      lineSegment.setAttribute('x1', String(datum.screenX1));
      lineSegment.setAttribute('y1', String(datum.screenY1));
      lineSegment.setAttribute('x2', String(datum.screenX2));
      lineSegment.setAttribute('y2', String(datum.screenY2));
      lineSegment.setAttribute('stroke-width', '0.2');

      const box = symbol.append('rect').datum(datum).node();
      box.setAttribute('class', `topology-renderer__canvas__symbol switch _${datum.name}_ ${datum.open ? 'open' : 'closed'}`);
      box.setAttribute('x', String(datum.midpointX - halfWidth));
      box.setAttribute('y', String(datum.midpointY - halfHeight));
      box.setAttribute('width', String(width));
      box.setAttribute('height', String(height));
      box.setAttribute('transform', transformValue);
      fragment.appendChild(symbol.node());
    }

    const group = container.append('g').attr('class', 'switch-symbol-container');
    group.node().appendChild(fragment);
  }

  render() {
    return (
      <div className={`topology-renderer ${this.isModelLarge() ? 'large' : 'small'}`}>
        <svg
          ref={this.svgRef}
          width='10000'
          height='10000'
          preserveAspectRatio='xMidYMid'
          className={`topology-renderer__canvas ${this.props.topology.name}`}
          onClick={this.showMenuOnComponentClicked}
          onMouseOver={this.showTooltip}
          onMouseOut={this.hideTooltip}>
          <defs>
            <marker
              id='arrow'
              orient='auto'
              markerWidth='4'
              markerHeight='4'
              refY='2'
              refX='2'>
              <path
                className='topology-renderer__canvas__arrow'
                d='M1,1 L3,2 L1,3 Z'
                refX='-0.5' />
            </marker>
            <marker
              id='red-arrow'
              orient='auto'
              markerWidth='4'
              markerHeight='4'
              refY='2'
              refX='2'>
              <path
                className='topology-renderer__canvas__arrow red'
                d='M1,1 L3,2 L1,3 Z'
                refX='-0.5' />
            </marker>
          </defs>
          <g className='topology-renderer__canvas__container' />
        </svg>
        <div className='topology-renderer__toolbox-container'>
          <div className='topology-renderer__toolbox'>
            <Tooltip content='Reset'>
              <IconButton
                icon='refresh'
                size='small'
                style='accent'
                onClick={this.canvasTransformService.reset} />
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
      </div>
    );
  }

  showMenuOnComponentClicked(event: React.MouseEvent) {
    const target = select(event.target as SVGElement);
    if (target.classed('switch')) {
      this._onSwitchClicked(target, event.clientX, event.clientY);
    } else if (target.classed('capacitor')) {
      this._onCapacitorClicked(target, event.clientX, event.clientY);
    } else if (target.classed('regulator')) {
      this._onRegulatorClicked(target, event.clientX, event.clientY);
    }
  }

  private _onSwitchClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>, clickX: number, clickY: number) {
    const swjtch = clickedElement.datum() as Switch;
    const portalRenderer = new PortalRenderer();
    portalRenderer.mount(
      <SwitchControlMenu
        left={clickX}
        top={clickY}
        switch={swjtch}
        onAfterClosed={portalRenderer.unmount}
        onSubmit={open => this.toggleSwitch(open, swjtch)} />
    );
  }

  toggleSwitch(open: boolean, swjtch: Switch) {
    if (swjtch.open !== open) {
      this.props.onToggleSwitch(swjtch, open);
    }
  }

  private _onCapacitorClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>, clickX: number, clickY: number) {
    const capacitor = clickedElement.datum() as Capacitor;
    const portalRenderer = new PortalRenderer();
    portalRenderer.mount(
      <CapacitorControlMenu
        left={clickX}
        top={clickY}
        capacitor={capacitor}
        onAfterClosed={portalRenderer.unmount}
        onSubmit={updatedCapacitor => {
          this.props.onCapacitorControlMenuFormSubmitted(capacitor, updatedCapacitor);
        }} />
    );
  }

  private _onRegulatorClicked(clickedElement: Selection<SVGElement, any, SVGElement, any>, clickX: number, clickY: number) {
    const regulator = clickedElement.datum() as Regulator;
    const portalRenderer = new PortalRenderer();
    portalRenderer.mount(
      <RegulatorControlMenu
        left={clickX}
        top={clickY}
        regulator={regulator}
        onAfterClosed={portalRenderer.unmount}
        onSubmit={updatedRegulator => {
          this.props.onRegulatorControlMenuFormSubmitted(regulator, updatedRegulator);
        }} />
    );
  }

  showTooltip(event: React.SyntheticEvent) {
    const target = select(event.target as SVGElement);
    this._timeout(250)
      .then(() => {
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
      });
  }

  private _timeout(duration: number) {
    return new Promise(resolve => {
      this._timer = setTimeout(resolve, duration);
    });
  }

  private _capitalize(value: string) {
    return value ? value[0].toUpperCase() + value.substr(1) : '';
  }

  hideTooltip() {
    clearTimeout(this._timer);
    this._tooltip?.hide();
    this._tooltip = null;
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
    const locatedElement = this.svgRef.current.querySelector(`.topology-renderer__canvas__node.${node.type}._${node.name}_`) as SVGCircleElement;
    if (locatedElement) {
      if (this.canvasTransformService.getCurrentZoomLevel() < 3) {
        this.canvasTransformService.setZoomLevel(this.isModelLarge() ? 6 : 3);
      }
      const nodeBoundingBox = locatedElement.getBoundingClientRect();
      this.canvasTransformService.zoomToPosition(nodeBoundingBox.left, nodeBoundingBox.top)
        .then(() => {
          this.setState({
            nodeToLocate: locatedElement
          });
        });
      return true;
    } else {
      showNotification(
        <>
          Unable to locate node &nbsp;
          <span className='topology-renderer__non-existing-searched-node'>
            {node.name}
          </span>
          &nbsp; in the model
        </>
      );
      return false;
    }
  }

}
