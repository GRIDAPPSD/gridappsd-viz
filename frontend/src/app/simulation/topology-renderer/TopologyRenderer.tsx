import * as React from 'react';
import { line } from 'd3-shape';
import { select, Selection, create } from 'd3-selection';
import { scaleLinear, ScaleLinear, selectAll } from 'd3';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { CanvasTransformService } from '@shared/CanvasTransformService';
import {
  Switch,
  Capacitor,
  Node,
  Edge,
  Regulator,
  Transformer,
  ConductingEquipmentType,
  MeasurementType,
  SolarPanel,
  NodeType,
  Substation,
  Battery
} from '@shared/topology';
import { Tooltip, showTooltipAt, hideTooltip } from '@shared/tooltip';
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
    [NodeType.CAPACITOR]: 1,
    [NodeType.REGULATOR]: 1,
    [NodeType.TRANSFORMER]: 1,
    [NodeType.SWITCH]: 1,
    [NodeType.SUBSTATION]: 1,
    [NodeType.SOLAR_PANEL]: 1,
    [NodeType.BATTERY]: 1
  };
  private readonly _symbolDimensions = {
    [NodeType.CAPACITOR]: { width: 52, height: 20 },
    [NodeType.REGULATOR]: { width: 45, height: 5 },
    [NodeType.TRANSFORMER]: { width: 30, height: 25 },
    [NodeType.SWITCH]: { width: 10, height: 10 },
    [NodeType.SUBSTATION]: { width: 15, height: 15 },
    [NodeType.SOLAR_PANEL]: { width: 20, height: 10 },
    [NodeType.BATTERY]: { width: 35, height: 25 }
  };
  private readonly _xScale: ScaleLinear<number, number> = scaleLinear();
  private readonly _yScale: ScaleLinear<number, number> = scaleLinear();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();
  private readonly _htmlElements = new Map<string, NodeListOf<Element>>();
  // Keys are switches' MRID
  private _switchMap = new Map<string, Switch>();

  private _containerSelection: Selection<SVGElement, any, any, any> = null;
  private _showNodeSymbols = false;
  private _timer: any;

  constructor(props: Props) {
    super(props);

    this.state = {
      showNodeSearcher: false,
      nodeToLocate: null
    };

    this.showMenuOnComponentClicked = this.showMenuOnComponentClicked.bind(this);
    this.showTooltip = this.showTooltip.bind(this);
    this.showNodeSearcher = this.showNodeSearcher.bind(this);
    this.onNodeSearcherClosed = this.onNodeSearcherClosed.bind(this);
    this.locateNode = this.locateNode.bind(this);

    this._calculateSymbolTransformOrigin = this._calculateSymbolTransformOrigin.bind(this);
  }

  componentWillUnmount() {
    hideTooltip();
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
    const swjtch = this._switchMap.get(measurement.conductingEquipmentMRID);
    if (measurement.type === MeasurementType.TAP && swjtch) {
      swjtch.open = measurement.value === 0;
      if (!this._htmlElements.has(swjtch.name)) {
        this._htmlElements.set(
          swjtch.name,
          this.svgRef.current.querySelectorAll(
            `.topology-renderer__canvas__node.switch._${swjtch.name}_,.topology-renderer__canvas__symbol.switch._${swjtch.name}_`
          )
        );
      }
      selectAll(this._htmlElements.get(swjtch.name))
        .classed('open', swjtch.open)
        .classed('closed', !swjtch.open);
    }
  }

  private _toggleACLineSegmentsWithNoPower(measurement: SimulationOutputMeasurement) {
    if (measurement.conductingEquipmentType === ConductingEquipmentType.ACLineSegment) {
      const edge = this.props.topology.edgeMap.get(measurement.conductingEquipmentName);
      if (edge) {
        if (!this._htmlElements.has(edge.name)) {
          const selectors = [
            `.topology-renderer__canvas__edge._${edge.name}_`,
            `.topology-renderer__canvas__node.${edge.from.type}._${edge.from.name}_:not(.switch)`,
            `.topology-renderer__canvas__symbol.${edge.from.type}._${edge.from.name}_:not(.switch)`,
            `.topology-renderer__canvas__node.${edge.to.type}._${edge.to.name}_:not(.switch)`,
            `.topology-renderer__canvas__symbol.${edge.to.type}._${edge.to.name}_:not(.switch)`
          ];
          const nodeAtFromLocation = this._locateNodeAtLocation(edge.from.x1, edge.from.y1);
          if (nodeAtFromLocation) {
            selectors.push(
              `.topology-renderer__canvas__node.${nodeAtFromLocation.type}._${nodeAtFromLocation.name}_:not(.switch)`,
              `.topology-renderer__canvas__symbol.${nodeAtFromLocation.type}._${nodeAtFromLocation.name}_:not(.switch)`
            );
          }
          const nodeAtToLocation = this._locateNodeAtLocation(edge.to.x1, edge.to.y1);
          if (nodeAtToLocation) {
            selectors.push(
              `.topology-renderer__canvas__node.${nodeAtToLocation.type}._${nodeAtToLocation.name}_:not(.switch)`,
              `.topology-renderer__canvas__symbol.${nodeAtToLocation.type}._${nodeAtToLocation.name}_:not(.switch)`
            );
          }
          this._htmlElements.set(edge.name, this.svgRef.current.querySelectorAll(selectors.join(',')));
        }
        selectAll(this._htmlElements.get(edge.name))
          .classed('no-power', -0.3 <= measurement.magnitude && measurement.magnitude <= 0.3);
      }
    }
  }

  private _locateNodeAtLocation(x: number, y: number) {
    let foundNode: Node = null;
    this.props.topology.nodeMap.forEach(node => {
      if (node.type !== NodeType.UNKNOWN && node.x1 === x && node.y1 === y) {
        foundNode = node;
      }
    });
    return foundNode;
  }

  componentDidMount() {
    const canvasBoundingBox = this.svgRef.current.getBoundingClientRect();
    const spacing = 10;
    this.svgRef.current.setAttribute('width', String(canvasBoundingBox.width));
    this.svgRef.current.setAttribute('height', String(canvasBoundingBox.height));
    this.svgRef.current.setAttribute('viewBox', `0 0 ${canvasBoundingBox.width} ${canvasBoundingBox.height}`);
    this._xScale.range([spacing, canvasBoundingBox.width - spacing]);
    this._yScale.range([spacing, canvasBoundingBox.height - spacing]);
    this._containerSelection = this.canvasTransformService.bindToSvgCanvas(this.svgRef.current).select('.topology-renderer__canvas__container');
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
          const foundNode = this.props.topology.nodeMap.get(nodeName);
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
    if (this.props.topology.nodeMap.size <= 200) {
      if (currentTransformScaleDegree > 1.5 && !this._showNodeSymbols) {
        this._showNodeSymbols = true;
        this._showSymbols();
      } else if (currentTransformScaleDegree < 1.5 && this._showNodeSymbols) {
        this._showNodeSymbols = false;
        this._hideSymbols();
      }
    } else if (currentTransformScaleDegree > 2.5 && !this._showNodeSymbols) {
      this._showNodeSymbols = true;
      this._showSymbols();
    } else if (currentTransformScaleDegree < 2.5 && this._showNodeSymbols) {
      this._showNodeSymbols = false;
      this._hideSymbols();
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
      this._htmlElements.clear();
      this._render();
    }
  }

  private _render() {
    const topology = this.props.topology;
    const nodeNameToEdgeMap = new Map<string, Edge>();
    topology.edgeMap.forEach(edge => {
      nodeNameToEdgeMap.set(edge.from.name, edge);
      nodeNameToEdgeMap.set(edge.to.name, edge);
    });
    const nodeRadius = this.isModelLarge() ? 1 : 3;
    const extents = this._calculateXYExtents(topology.nodeMap);
    this._xScale.domain(extents.x);
    this._yScale.domain(extents.y);

    this._resolveSymbolDimensions();

    if (topology.name.includes('9500') && !topology.inverted) {
      topology.inverted = true;
      this._invert9500Model(topology.nodeMap);
    }

    const categories = this._categorizeNodes(topology.nodeMap);

    this._containerSelection.selectAll('g').remove();

    this._renderEdges(topology.edgeMap);

    if (!this.isModelLarge()) {
      const container = create<SVGElement>('svg:g') as Selection<SVGElement, any, SVGElement, any>;
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

    const knownNodeContainers = create<SVGElement>('svg:g')
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
    this._renderSwitchNodes(
      knownNodeContainers,
      categories.switches,
      nodeRadius
    );
    this._renderNonSwitchNodes(
      knownNodeContainers,
      'capacitor-node-container',
      categories.capacitors,
      nodeRadius
    );
    this._renderNonSwitchNodes(
      knownNodeContainers,
      'battery-node-container',
      categories.batteries,
      nodeRadius
    );
    this._renderNonSwitchNodes(
      knownNodeContainers,
      'solar-panel-node-container',
      categories.solarPanels,
      nodeRadius
    );

    const symbolContainers = create<SVGElement>('svg:g')
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
    this._renderTransformerSymbols(
      symbolContainers,
      categories.transformers,
      nodeNameToEdgeMap
    );
    this._renderSwitchSymbols(
      symbolContainers,
      categories.switches
    );
    this._renderCapacitorSymbols(
      symbolContainers,
      categories.capacitors,
      nodeNameToEdgeMap
    );
    this._renderBatterySymbols(
      symbolContainers,
      categories.batteries,
      nodeNameToEdgeMap
    );
    this._renderSolarPanelSymbols(
      symbolContainers,
      categories.solarPanels,
      nodeNameToEdgeMap
    );

    this._containerSelection.node()
      .appendChild(knownNodeContainers.node());
    this._containerSelection.node()
      .appendChild(symbolContainers.node());
  }

  isModelLarge() {
    return this.props.topology.nodeMap.size >= 1000;
  }

  private _calculateXYExtents(nodeMap: Map<string, Node>) {
    const xExtent = [Infinity, -Infinity] as [number, number];
    const yExtent = [Infinity, -Infinity] as [number, number];
    nodeMap.forEach(node => {
      if (node.x1 < xExtent[0]) {
        xExtent[0] = node.x1;
      }
      if (node.x1 > xExtent[1]) {
        xExtent[1] = node.x1;
      }
      if (node.y1 < yExtent[0]) {
        yExtent[0] = node.y1;
      }
      if (node.y1 > yExtent[1]) {
        yExtent[1] = node.y1;
      }
    });
    return {
      x: xExtent,
      y: yExtent
    };
  }

  private _resolveSymbolDimensions() {
    if (this.isModelLarge()) {
      this._scalingFactorPerSymbolTable[NodeType.CAPACITOR] = 7;
      this._scalingFactorPerSymbolTable[NodeType.TRANSFORMER] = 7;
      this._scalingFactorPerSymbolTable[NodeType.REGULATOR] = 7;
      this._scalingFactorPerSymbolTable[NodeType.SUBSTATION] = 7;
      this._scalingFactorPerSymbolTable[NodeType.SOLAR_PANEL] = 7;
      this._scalingFactorPerSymbolTable[NodeType.BATTERY] = 7;
    } else {
      this._scalingFactorPerSymbolTable[NodeType.CAPACITOR] = 3.5;
      this._scalingFactorPerSymbolTable[NodeType.TRANSFORMER] = 3.5;
      this._scalingFactorPerSymbolTable[NodeType.REGULATOR] = 3.5;
      this._scalingFactorPerSymbolTable[NodeType.SUBSTATION] = 3.5;
      this._scalingFactorPerSymbolTable[NodeType.SOLAR_PANEL] = 3.5;
      this._scalingFactorPerSymbolTable[NodeType.BATTERY] = 3.5;
    }

    for (const [type, scalingFactor] of Object.entries(this._scalingFactorPerSymbolTable)) {
      this._symbolDimensions[type].width /= scalingFactor;
      this._symbolDimensions[type].height /= scalingFactor;
    }
    if (this.isModelLarge()) {
      this._symbolDimensions[NodeType.SWITCH].width = 3;
      this._symbolDimensions[NodeType.SWITCH].height = 3;
    }
  }

  private _invert9500Model(nodeMap: Map<string, Node>) {
    const [minYCoordinate, maxYCoordinate] = this._yScale.domain();
    nodeMap.forEach(node => {
      node.y1 = minYCoordinate + (maxYCoordinate - node.y1);
      if ('y2' in node) {
        (node as any).y2 = minYCoordinate + (maxYCoordinate - (node as any).y2);
      }
    });
  }

  private _categorizeNodes(nodeMap: Map<string, Node>) {
    const categories = {
      switches: [] as Switch[],
      capacitors: [] as Capacitor[],
      transformers: [] as Transformer[],
      regulators: [] as Regulator[],
      substations: [] as Node[],
      solarPanels: [] as SolarPanel[],
      batteries: [] as Battery[],
      unknownNodes: [] as Node[],
      otherNodes: [] as Node[]
    };

    nodeMap.forEach(node => {
      node.screenX1 = this._xScale(node.x1);
      node.screenY1 = this._yScale(node.y1);

      switch (node.type) {
        case NodeType.SWITCH:
          (node as Switch).screenX2 = this._xScale((node as Switch).x2);
          (node as Switch).screenY2 = this._yScale((node as Switch).y2);
          (node as Switch).midpointX = (node.screenX1 + (node as Switch).screenX2) / 2;
          (node as Switch).midpointY = (node.screenY1 + (node as Switch).screenY2) / 2;
          categories.switches.push(node as Switch);
          if (node.mRIDs.length > 0) {
            this._switchMap.set(node.mRIDs[0], node as Switch);
          }
          break;
        case NodeType.CAPACITOR:
          categories.capacitors.push(node as Capacitor);
          break;
        case NodeType.TRANSFORMER:
          categories.transformers.push(node as Transformer);
          break;
        case NodeType.REGULATOR:
          categories.regulators.push(node as Regulator);
          break;
        case NodeType.SUBSTATION:
          categories.substations.push(node as Substation);
          break;
        case NodeType.SOLAR_PANEL:
          categories.solarPanels.push(node as SolarPanel);
          break;
        case NodeType.BATTERY:
          categories.batteries.push(node as Battery);
          break;
        case NodeType.UNKNOWN:
          categories.unknownNodes.push(node);
          break;
        default:
          categories.otherNodes.push(node);
          break;
      }
    });
    return categories;
  }

  private _renderEdges(edgeMap: Map<string, Edge>) {
    const documentFragment = document.createDocumentFragment();
    const edgeGenerator = line<Node>()
      .x(node => node.screenX1)
      .y(node => node.screenY1);
    edgeMap.forEach(edge => {
      const path = create('svg:path').node();
      path.setAttribute('class', `topology-renderer__canvas__edge _${edge.name}_`);
      path.setAttribute('d', edgeGenerator([edge.from, edge.to]));
      documentFragment.appendChild(path);
    });

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

  private _renderRegulatorSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    regulators: Regulator[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions[NodeType.REGULATOR];
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

  private _calculateSymbolTransformOrigin(node: Node) {
    const width = this._symbolDimensions[node.type]?.width || symbolSize;
    const height = this._symbolDimensions[node.type]?.height || symbolSize;
    if (node.type === NodeType.CAPACITOR || node.type === NodeType.REGULATOR) {
      return `${node.screenX1 + (width / 2)}px ${node.screenY1}px`;
    }
    return `${node.screenX1 + (width / 2)}px ${node.screenY1 + (height / 2)}px`;
  }

  private _calculateSymbolTransform(node: Node, nodeNameToEdgeMap: Map<string, Edge>) {
    const edge = nodeNameToEdgeMap.get((node as any).from) || nodeNameToEdgeMap.get((node as any).to);
    if (!edge && node.type === NodeType.CAPACITOR) {
      return 'translate(0, 0) rotate(0)';
    }
    const width = this._symbolDimensions[node.type]?.width || symbolSize;
    const height = this._symbolDimensions[node.type]?.height || symbolSize;
    const angle = !edge ? 0 : this._calculateAngleBetweenLineAndXAxis(edge.from.x1, edge.from.y1, edge.to.x1, edge.to.y1);
    switch (node.type) {
      case NodeType.REGULATOR:
      case NodeType.CAPACITOR:
      case NodeType.SUBSTATION:
      case NodeType.BATTERY:
        return `translate(-${width / 2}px, 0px) rotate(${angle}deg)`;
      default:
        return `translate(-${width / 2}px, -${height / 2}px) rotate(${angle}deg)`;
    }
  }

  private _calculateAngleBetweenLineAndXAxis(x1: number, y1: number, x2: number, y2: number) {
    const horizontal = x2 - x1;
    const vertical = y2 - y1;
    return (Math.atan2(vertical, horizontal) * 180 / Math.PI) || 0;
  }

  private _renderSubstationSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    substations: Node[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions[NodeType.SUBSTATION];
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

  private _renderTransformerSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    transformers: Transformer[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions[NodeType.TRANSFORMER];
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
    const width = this._symbolDimensions[NodeType.SWITCH].width;
    const height = this._symbolDimensions[NodeType.SWITCH].height;
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

  private _renderCapacitorSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    capacitors: Capacitor[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions[NodeType.CAPACITOR];
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

  private _renderBatterySymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    batteries: Battery[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions[NodeType.BATTERY];
    const _10PercentWidth = width * 0.10;
    const _20PercentWidth = width * 0.20;
    const _40PercentWidth = width * 0.40;
    const _60PercentWidth = width * 0.60;
    const _80PercentWidth = width * 0.80;
    const _25PercentHeight = height * 0.25;
    const _30PercentHeight = height * 0.30;
    const _50PercentHeight = height * 0.5;

    this._renderNonSwitchSymbols(
      container,
      batteries,
      nodeNameToEdgeMap,
      `
        M\${startingPoint}
        h${_40PercentWidth}
        m0,${-_50PercentHeight}
        v${height}
        m${_20PercentWidth},${-_25PercentHeight}
        v${-_50PercentHeight}
        m0,${_25PercentHeight}
        h${_40PercentWidth}
        m${-_80PercentWidth},${-_30PercentHeight}
        h${-_10PercentWidth}
        h${_20PercentWidth}
        m${-_10PercentWidth},${-_10PercentWidth}
        v${_20PercentWidth}
        m${_60PercentWidth},${-_10PercentWidth}
        h${-_10PercentWidth}
        h${_20PercentWidth}
      `
    );
  }

  private _renderSolarPanelSymbols(
    container: Selection<SVGElement, any, SVGElement, any>,
    solarPanels: SolarPanel[],
    nodeNameToEdgeMap: Map<string, Edge>
  ) {
    const { width, height } = this._symbolDimensions[NodeType.SOLAR_PANEL];
    const _33PercentWidth = width * 0.33;

    this._renderNonSwitchSymbols(
      container,
      solarPanels,
      nodeNameToEdgeMap,
      `
        M\${startingPoint}
        h${width}
        l${-_33PercentWidth},${height}
        h${-width}
        Z
      `
    );
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
          onMouseOut={hideTooltip}>
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
          nodeMap={this.props.topology ? this.props.topology.nodeMap : new Map()}
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
    const node = select(event.target as SVGElement).datum() as Node;
    switch (node?.type) {
      case NodeType.SWITCH:
        this._onSwitchClicked(node as Switch, event.clientX, event.clientY);
        break;
      case NodeType.CAPACITOR:
        this._onCapacitorClicked(node as Capacitor, event.clientX, event.clientY);
        break;
      case NodeType.REGULATOR:
        this._onRegulatorClicked(node as Regulator, event.clientX, event.clientY);
        break;
    }
  }

  private _onSwitchClicked(swjtch: Switch, clickX: number, clickY: number) {
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

  private _onCapacitorClicked(capacitor: Capacitor, clickX: number, clickY: number) {
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

  private _onRegulatorClicked(regulator: Regulator, clickX: number, clickY: number) {
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
    const eventTarget = event.target as SVGElement;
    this._timeout(250)
      .then(() => {
        const node = select(eventTarget).datum() as Node;
        if (node) {
          const content = `${this._capitalize(node.type.replace(/-/g, ' '))}: ${node.name}`;
          showTooltipAt(eventTarget, content);
        }
      });
  }

  private _timeout(duration: number) {
    clearTimeout(this._timer);
    return new Promise(resolve => {
      this._timer = setTimeout(resolve, duration);
    });
  }

  private _capitalize(value: string) {
    return value ? value[0].toUpperCase() + value.substr(1) : '';
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
