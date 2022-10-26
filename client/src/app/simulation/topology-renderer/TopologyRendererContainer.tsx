import { Component } from 'react';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';

import { waitUntil } from '@client:common/misc';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { StateStore } from '@client:common/state-store';
import { CurrentLimit } from '@client:common/measurement-limits';
import {
  SimulationQueue,
  SimulationConfiguration,
  DEFAULT_SIMULATION_CONFIGURATION,
  SimulationOutputMeasurement
} from '@client:common/simulation';
import { StompClientService } from '@client:common/StompClientService';
import {
  Node,
  Regulator,
  RegulatorControlMode,
  Switch,
  TopologyModel,
  Capacitor,
  CapacitorControlMode,
  NodeType,
  Edge
} from '@client:common/topology';
import { SimulationManagementService } from '@client:common/simulation';


import { TopologyRenderer } from './TopologyRenderer';
import { OpenOrCloseCapacitorRequest } from './models/OpenOrCloseCapacitorRequest';
import { ToggleSwitchStateRequest } from './models/ToggleSwitchStateRequest';
import { GetTopologyModelRequest } from './models/GetTopologyModelRequest';
import { ToggleCapacitorManualModeRequest } from './models/ToggleCapacitorManualModeRequest';
import { ToggleRegulatorManualModeRequest } from './models/ToggleRegulatorManualModeRequest';
import { CapacitorVarUpdateRequest } from './models/CapacitorVarUpdateRequest';
import { CapacitorVoltUpdateRequest } from './models/CapacitorVoltUpdateRequest';
import { RegulatorLineDropUpdateRequest } from './models/RegulatorLineDropUpdateRequest';
import { RegulatorTapChangerRequest } from './models/RegulatorTapChangerRequest';
import { RenderableTopology } from './models/RenderableTopology';


interface Props {
  mRIDs: Map<string, string | string[]>;
  phases: Map<string, string[]>;
}

interface State {
  topology: RenderableTopology;
  isFetching: boolean;
  simulationOutputMeasurements: SimulationOutputMeasurement[];
}

const topologyModelCache = new Map<string, TopologyModel>();

export class TopologyRendererContainer extends Component<Props, State> {

  // Keys are conducting equipment MRID's
  readonly currentLimitMap = new Map<string, CurrentLimit>();

  activeSimulationConfig: SimulationConfiguration = DEFAULT_SIMULATION_CONFIGURATION;

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _simulationManagementService = SimulationManagementService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  private _activeSimulationStream: Subscription = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      topology: {
        name: this.activeSimulationConfig.simulation_config.simulation_name,
        nodeMap: new Map(),
        edgeMap: new Map(),
        inverted: false
      },
      isFetching: true,
      simulationOutputMeasurements: []
    };

    this.activeSimulationConfig = this._simulationQueue.getActiveSimulation()?.config || DEFAULT_SIMULATION_CONFIGURATION;

    this.onToggleSwitchState = this.onToggleSwitchState.bind(this);
    this.onCapacitorControlMenuFormSubmitted = this.onCapacitorControlMenuFormSubmitted.bind(this);
    this.onRegulatorControlMenuFormSubmitted = this.onRegulatorControlMenuFormSubmitted.bind(this);
  }

  componentDidMount() {
    this._observeActiveSimulationChangeEvent();
    this._subscribeToSimulationOutputMeasurementMapStream();
    this._updateRenderableTopologyOnSimulationSnapshotReceived();
    this._fetchCurrentLimitsFromStateStore();
  }

  private _observeActiveSimulationChangeEvent() {
    this._activeSimulationStream = this._simulationQueue.activeSimulationChanged()
      .subscribe({
        next: simulation => {
          this.activeSimulationConfig = simulation.config;
          // If the user received a new simulation config object
          // and currently not in a simulation, they were the one that created
          // it. Otherwise, they received it by joining an active simulation,
          // in that case, we don't want to do anything here
          if (!this._simulationManagementService.isUserInActiveSimulation()) {
            const lineName = simulation.config.power_system_config.Line_name;
            if (topologyModelCache.has(lineName)) {
              const topologyModel = topologyModelCache.get(lineName);
              this._processModelForRendering(topologyModel);
              this._simulationManagementService.syncSimulationSnapshotState({
                topologyModel
              });
            } else {
              this._fetchTopologyModel(lineName);
            }
          }
        }
      });
  }

  private _fetchTopologyModel(lineName: string) {
    const getTopologyModelRequest = new GetTopologyModelRequest(lineName);
    this.setState({
      isFetching: true
    });
    this._subscribeToTopologyModelTopic(getTopologyModelRequest.replyTo);
    this._stompClientService.send({
      destination: getTopologyModelRequest.url,
      replyTo: getTopologyModelRequest.replyTo,
      body: JSON.stringify(getTopologyModelRequest.requestBody)
    });
  }

  private _subscribeToTopologyModelTopic(destination: string) {
    this._stompClientService.readOnceFrom<TopologyModel>(destination)
      .pipe(takeWhile(() => !this._activeSimulationStream.closed))
      .subscribe({
        next: (topologyModel: TopologyModel) => {
          this._processModelForRendering(topologyModel);
          this._simulationManagementService.syncSimulationSnapshotState({
            topologyModel
          });
          topologyModelCache.set(this.activeSimulationConfig.power_system_config.Line_name, topologyModel);
        }
      });
  }

  private _processModelForRendering(topologyModel: TopologyModel) {
    waitUntil(() => this.props.mRIDs.size > 0)
      .then(() => {
        this.setState({
          topology: this._transformModelForRendering(topologyModel),
          isFetching: false
        });
      });
  }

  private _transformModelForRendering(model: TopologyModel): RenderableTopology {
    if (!model || model.feeders.length === 0) {
      return null;
    }
    const feeder = model.feeders[0];
    const renderableTopology: RenderableTopology = {
      name: feeder.name,
      nodeMap: new Map(),
      edgeMap: new Map(),
      inverted: false
    };
    for (const group of ['batteries', 'switches', 'solarpanels', 'swing_nodes', 'transformers', 'capacitors', 'regulators']) {
      for (const datum of feeder[group]) {
        const mRIDs = this.props.mRIDs.get(datum.name) || [];
        const resolvedMRIDs = Array.isArray(mRIDs) ? mRIDs : [mRIDs];
        let node: Node;
        switch (group) {
          case 'swing_nodes':
            node = this._createNewNode({
              ...datum,
              type: NodeType.SWING_NODE,
              mRIDs: resolvedMRIDs
            });
            break;

          case 'batteries':
            node = this._createNewNode({
              ...datum,
              type: NodeType.BATTERY,
              mRIDs: resolvedMRIDs
            });
            break;

          case 'switches':
            node = this._createNewNode({
              type: NodeType.SWITCH,
              screenX2: 0,
              screenY2: 0,
              ...datum,
              open: datum.open === 'open',
              mRIDs: resolvedMRIDs
            });
            break;

          case 'solarpanels':
            node = this._createNewNode({
              ...datum,
              type: NodeType.SOLAR_PANEL,
              mRIDs: resolvedMRIDs
            });
            break;

          case 'transformers':
            node = this._createNewNode({
              ...datum,
              type: NodeType.TRANSFORMER,
              x1: datum.x1 !== 0 ? datum.x1 : datum.x2,
              y1: datum.y1 !== 0 ? datum.y1 : datum.y2,
              mRIDs: resolvedMRIDs
            });
            break;

          case 'capacitors':
            node = this._createNewNode({
              ...datum,
              type: NodeType.CAPACITOR,
              open: datum.open === 'open',
              manual: datum.manual === 'manual',
              controlMode: CapacitorControlMode.UNSPECIFIED,
              volt: null,
              var: null,
              mRIDs: resolvedMRIDs
            });
            break;

          case 'regulators':
            node = this._createNewNode({
              ...datum,
              type: NodeType.REGULATOR,
              x1: datum.x2,
              y1: datum.y2,
              manual: datum.manual === 'manual',
              controlModel: RegulatorControlMode.UNSPECIFIED,
              phaseValues: null,
              phases: this.props.phases.get(datum.name),
              mRIDs: resolvedMRIDs
            });
            break;
        }
        renderableTopology.nodeMap.set(node.name, node);
      }
    }

    for (const overheadLine of feeder.overhead_lines) {
      let fromNode = renderableTopology.nodeMap.get(overheadLine.from);
      let toNode = renderableTopology.nodeMap.get(overheadLine.to);

      if (!fromNode) {
        fromNode = this._createNewNode({
          name: overheadLine.from,
          x1: overheadLine.x1,
          y1: overheadLine.y1
        });
        renderableTopology.nodeMap.set(fromNode.name, fromNode);
      }
      if (!toNode) {
        toNode = this._createNewNode({
          name: overheadLine.to,
          x1: overheadLine.x2,
          y1: overheadLine.y2
        });
        renderableTopology.nodeMap.set(toNode.name, toNode);
      }
      renderableTopology.edgeMap.set(
        overheadLine.name,
        {
          name: overheadLine.name,
          from: fromNode,
          to: toNode
        }
      );
    }

    this._resolveCoordinates(renderableTopology.nodeMap);
    this._removeDegenerateEdges(renderableTopology.edgeMap);

    return renderableTopology;
  }

  private _createNewNode(properties: { [key: string]: string | number | NodeType }): Node {
    return {
      x1: -1,
      y1: -1,
      screenX1: 0,
      screenY1: 0,
      name: '',
      type: NodeType.UNKNOWN,
      ...properties
    } as Node;
  }

  private _resolveCoordinates(nodeMap: Map<string, Node>) {
    const coordinatesInLatLong = this._areCoordinatesInLatLong(nodeMap);
    nodeMap.forEach(node => {
      if (coordinatesInLatLong) {
        const { x, y } = this._latLongToXY(node.x1, node.y1);
        node.x1 = x;
        node.y1 = y;
      }
      node.x1 = Math.trunc(node.x1);
      node.y1 = Math.trunc(node.y1);
      if (node.type === NodeType.SWITCH) {
        if (coordinatesInLatLong) {
          const { x, y } = this._latLongToXY(node['x2'], node['y2']);
          node['x2'] = x;
          node['y2'] = y;
        }
        node['x2'] = Math.trunc(node['x2']);
        node['y2'] = Math.trunc(node['y2']);
      }
    });
  }

  private _areCoordinatesInLatLong(nodeMap: Map<string, Node>) {
    let minX = Infinity;
    let maxX = -Infinity;
    nodeMap.forEach(node => {
      if (node.x1 < minX) {
        minX = node.x1;
      }
      if (node.x1 > maxX) {
        maxX = node.x1;
      }
    });
    return maxX - minX <= 1;
  }

  private _latLongToXY(longitude: number, lat: number): { x: number; y: number } {
    return {
      // Archive the old method of calculating Lat and Long to xy coordinations
      // x: Math.floor(136.0 * (longitude + 77.0292) / (-77.0075 + 77.0292)) / 10,
      // y: Math.floor(117.0 * (lat - 38.8762) / (38.8901 - 38.8762)) / 10

      x: 136.0 * (longitude + 77.0292) / 0.00217,
      y: 114.0 * (lat - 38.8762) / 0.00139
    };
  }

  private _removeDegenerateEdges(edgeMap: Map<string, Edge>) {
    edgeMap.forEach((edge, edgeId) => {
      if (edge.from.x1 === edge.to.x1 && edge.from.y1 === edge.to.y1) {
        edgeMap.delete(edgeId);
      }
    });
  }

  private _subscribeToSimulationOutputMeasurementMapStream() {
    this._simulationManagementService.simulationOutputMeasurementMapReceived()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: measurements => {
          this.setState({
            simulationOutputMeasurements: [...measurements.values()]
          });
        }
      });
  }

  private _updateRenderableTopologyOnSimulationSnapshotReceived() {
    this._simulationManagementService.selectSimulationSnapshotState('topologyModel')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: (topologyModel: TopologyModel) => {
          waitUntil(() => this.props.mRIDs.size > 0)
            .then(() => {
              this.setState({
                topology: this._transformModelForRendering(topologyModel),
                isFetching: false
              });
              topologyModelCache.set(topologyModel.feeders[0].mRID, topologyModel);
            });
        }
      });
  }

  private _fetchCurrentLimitsFromStateStore() {
    this._stateStore.select('currentLimits')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: currentLimits => {
          for (const currentLimit of currentLimits) {
            this.currentLimitMap.set(currentLimit.id, currentLimit);
          }
        }
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
    this._activeSimulationStream.unsubscribe();
  }

  render() {
    return (
      <>
        <TopologyRenderer
          topology={this.state.topology}
          simulationOutputMeasurements={this.state.simulationOutputMeasurements}
          currentLimitMap={this.currentLimitMap}
          onToggleSwitch={this.onToggleSwitchState}
          onCapacitorControlMenuFormSubmitted={this.onCapacitorControlMenuFormSubmitted}
          onRegulatorControlMenuFormSubmitted={this.onRegulatorControlMenuFormSubmitted} />
        <ProgressIndicator show={this.state.isFetching} />
      </>
    );
  }

  onToggleSwitchState(swjtch: Switch, open: boolean) {
    const toggleSwitchStateRequest = new ToggleSwitchStateRequest({
      componentMRID: this.props.mRIDs.get(swjtch.name) as string,
      simulationId: this._simulationQueue.getActiveSimulation().id,
      open,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send({
      destination: toggleSwitchStateRequest.url,
      replyTo: toggleSwitchStateRequest.replyTo,
      body: JSON.stringify(toggleSwitchStateRequest.requestBody)
    });
  }

  onCapacitorControlMenuFormSubmitted(currentCapacitor: Capacitor, updatedCapacitor: Capacitor) {
    switch (updatedCapacitor.controlMode) {
      case CapacitorControlMode.MANUAL:
        if (currentCapacitor.controlMode !== updatedCapacitor.controlMode) {
          currentCapacitor.manual = true;
          this._toggleCapacitorManualMode(updatedCapacitor);
        }
        if (currentCapacitor.open !== updatedCapacitor.open) {
          currentCapacitor.open = updatedCapacitor.open;
          this._openOrCloseCapacitor(updatedCapacitor);
        }
        break;
      case CapacitorControlMode.VAR:
        // Send request only if we switched from manual mode
        if (currentCapacitor.controlMode === CapacitorControlMode.MANUAL) {
          currentCapacitor.manual = false;
          this._toggleCapacitorManualMode(currentCapacitor);
        }
        currentCapacitor.var = updatedCapacitor.var;
        this._sendCapacitorVarUpdateRequest(currentCapacitor);
        break;
      case CapacitorControlMode.VOLT:
        // Send request only if we switched from manual mode
        if (currentCapacitor.controlMode === CapacitorControlMode.MANUAL) {
          currentCapacitor.manual = false;
          this._toggleCapacitorManualMode(currentCapacitor);
        }
        currentCapacitor.volt = updatedCapacitor.volt;
        this._sendCapacitorVoltUpdateRequest(currentCapacitor);
        break;
    }
    currentCapacitor.controlMode = updatedCapacitor.controlMode;
  }

  private _toggleCapacitorManualMode(capacitor: Capacitor) {
    const toggleCapacitorManualModeRequest = new ToggleCapacitorManualModeRequest({
      componentMRID: this.props.mRIDs.get(capacitor.name) as string,
      simulationId: this._simulationQueue.getActiveSimulation().id,
      manual: capacitor.manual,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send({
      destination: toggleCapacitorManualModeRequest.url,
      replyTo: toggleCapacitorManualModeRequest.replyTo,
      body: JSON.stringify(toggleCapacitorManualModeRequest.requestBody)
    });
  }

  private _openOrCloseCapacitor(capacitor: Capacitor) {
    const openOrCloseCapacitorRequest = new OpenOrCloseCapacitorRequest({
      componentMRID: this.props.mRIDs.get(capacitor.name) as string,
      simulationId: this._simulationQueue.getActiveSimulation().id,
      open: capacitor.open,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send({
      destination: openOrCloseCapacitorRequest.url,
      replyTo: openOrCloseCapacitorRequest.replyTo,
      body: JSON.stringify(openOrCloseCapacitorRequest.requestBody)
    });
  }

  private _sendCapacitorVarUpdateRequest(capacitor: Capacitor) {
    const capacitorVarUpdateRequest = new CapacitorVarUpdateRequest({
      componentMRID: this.props.mRIDs.get(capacitor.name) as string,
      simulationId: this._simulationQueue.getActiveSimulation().id,
      target: capacitor.var.target,
      deadband: capacitor.var.deadband,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send({
      destination: capacitorVarUpdateRequest.url,
      replyTo: capacitorVarUpdateRequest.replyTo,
      body: JSON.stringify(capacitorVarUpdateRequest.requestBody)
    });
  }

  private _sendCapacitorVoltUpdateRequest(capacitor: Capacitor) {
    const capacitorVoltUpdateRequest = new CapacitorVoltUpdateRequest({
      componentMRID: this.props.mRIDs.get(capacitor.name) as string,
      simulationId: this._simulationQueue.getActiveSimulation().id,
      target: capacitor.volt.target,
      deadband: capacitor.volt.deadband,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send({
      destination: capacitorVoltUpdateRequest.url,
      replyTo: capacitorVoltUpdateRequest.replyTo,
      body: JSON.stringify(capacitorVoltUpdateRequest.requestBody)
    });
  }

  onRegulatorControlMenuFormSubmitted(currentRegulator: Regulator, updatedRegulator: Regulator) {
    if (currentRegulator.controlMode !== updatedRegulator.controlMode) {
      this._toggleRegulatorManualMode(updatedRegulator);
    }
    switch (updatedRegulator.controlMode) {
      case RegulatorControlMode.MANUAL:
        currentRegulator.manual = true;
        this._sendRegulatorTapChangerRequestForAllPhases(updatedRegulator);
        break;
      case RegulatorControlMode.LINE_DROP_COMPENSATION:
        currentRegulator.manual = false;
        this._sendRegulatorLineDropComponensationRequestForAllPhases(updatedRegulator);
        break;
    }
    currentRegulator.controlMode = updatedRegulator.controlMode;
    currentRegulator.phaseValues = updatedRegulator.phaseValues;
  }

  private _toggleRegulatorManualMode(regulator: Regulator) {
    (this.props.mRIDs.get(regulator.name) as string[])
      .map((mRID, index) => {
        return new ToggleRegulatorManualModeRequest({
          componentMRID: mRID,
          simulationId: this._simulationQueue.getActiveSimulation().id,
          manual: regulator.manual,
          differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
        });
      })
      .forEach(request => {
        this._stompClientService.send({
          destination: request.url,
          replyTo: request.replyTo,
          body: JSON.stringify(request.requestBody)
        });
      });
  }

  private _sendRegulatorTapChangerRequestForAllPhases(regulator: Regulator) {
    (this.props.mRIDs.get(regulator.name) as string[])
      .map((mRID, index) => {
        const phase = regulator.phases[index];
        const phaseValue = regulator.phaseValues[phase];
        return new RegulatorTapChangerRequest({
          mRID,
          simulationId: this._simulationQueue.getActiveSimulation().id,
          differenceMRID: this.activeSimulationConfig.power_system_config.Line_name,
          phase,
          tapValue: phaseValue.tap
        });
      })
      .forEach(request => {
        this._stompClientService.send({
          destination: request.url,
          replyTo: request.replyTo,
          body: JSON.stringify(request.requestBody)
        });
      });
  }

  private _sendRegulatorLineDropComponensationRequestForAllPhases(regulator: Regulator) {
    (this.props.mRIDs.get(regulator.name) as string[])
      .map((mRID, index) => {
        const phase = regulator.phases[index];
        const phaseValue = regulator.phaseValues[phase];
        return new RegulatorLineDropUpdateRequest({
          mRID,
          simulationId: this._simulationQueue.getActiveSimulation().id,
          differenceMRID: this.activeSimulationConfig.power_system_config.Line_name,
          lineDropR: phaseValue.lineDropR,
          lineDropX: phaseValue.lineDropX,
          phase
        });
      })
      .forEach(request => {
        this._stompClientService.send({
          destination: request.url,
          replyTo: request.replyTo,
          body: JSON.stringify(request.requestBody)
        });
      });
  }

}
