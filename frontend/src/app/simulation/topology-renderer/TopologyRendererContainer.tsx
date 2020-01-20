import * as React from 'react';
import { Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { extent } from 'd3-array';

import { TopologyRenderer } from './TopologyRenderer';
import {
  SimulationQueue,
  SimulationConfiguration,
  DEFAULT_SIMULATION_CONFIGURATION
} from '@shared/simulation';
import { StompClientService } from '@shared/StompClientService';
import {
  Node,
  Regulator,
  RegulatorControlMode,
  Switch,
  TopologyModel,
  Capacitor,
  CapacitorControlMode
} from '@shared/topology';
import { OpenOrCloseCapacitorRequest } from './models/OpenOrCloseCapacitorRequest';
import { ToggleSwitchStateRequest } from './models/ToggleSwitchStateRequest';
import { GetTopologyModelRequest, GetTopologyModelRequestPayload } from './models/GetTopologyModelRequest';
import { ToggleCapacitorManualModeRequest } from './models/ToggleCapacitorManualModeRequest';
import { ToggleRegulatorManualModeRequest } from './models/ToggleRegulatorManualModeRequest';
import { CapacitorVarUpdateRequest } from './models/CapacitorVarUpdateRequest';
import { CapacitorVoltUpdateRequest } from './models/CapacitorVoltUpdateRequest';
import { RegulatorLineDropUpdateRequest } from './models/RegulatorLineDropUpdateRequest';
import { RegulatorTapChangerRequest } from './models/RegulatorTapChangerRequest';
import { RenderableTopology } from './models/RenderableTopology';
import { waitUntil } from '@shared/misc';
import { Wait } from '@shared/wait';
import { SimulationControlService } from '@shared/simulation';

interface Props {
  mRIDs: Map<string, string & string[]>;
  phases: Map<string, string[]>;
}

interface State {
  topology: RenderableTopology;
  isFetching: boolean;
}

const topologyModelCache = new Map<string, TopologyModel>();

export class TopologyRendererContainer extends React.Component<Props, State> {

  activeSimulationConfig: SimulationConfiguration = DEFAULT_SIMULATION_CONFIGURATION;

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _switches = new Set<Switch>();
  private readonly _simulationControlService = SimulationControlService.getInstance();

  private _activeSimulationStream: Subscription = null;
  private _simulationOutputStream: Subscription = null;
  private _simulationSnapshotStream: Subscription = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      topology: {
        name: this.activeSimulationConfig.simulation_config.simulation_name,
        nodes: [],
        edges: [],
        inverted: false
      },
      isFetching: true
    };

    this.activeSimulationConfig = this._simulationQueue.getActiveSimulation()?.config || DEFAULT_SIMULATION_CONFIGURATION;

    this.onToggleSwitchState = this.onToggleSwitchState.bind(this);
    this.onCapacitorMenuFormSubmitted = this.onCapacitorMenuFormSubmitted.bind(this);
    this.onRegulatorMenuFormSubmitted = this.onRegulatorMenuFormSubmitted.bind(this);
  }

  componentDidMount() {
    this._activeSimulationStream = this._observeActiveSimulationChangeEvent();
    this._simulationOutputStream = this._toggleSwitchesOnOutputMeasurementsReceived();
    this._simulationSnapshotStream = this._updateRenderableTopologyOnSimulationSnapshotReceived();
  }

  private _observeActiveSimulationChangeEvent() {
    return this._simulationQueue.activeSimulationChanged()
      .pipe(takeWhile(() => this._activeSimulationStream === null))
      .subscribe({
        next: simulation => {
          this.activeSimulationConfig = simulation.config;
          // If the user received a new simulation config object
          // and currently not in a simulation, they were the one that created
          // it. Otherwise, they received it by joining an active simulation,
          // in that case, we don't want to do anything here
          if (!this._simulationControlService.isUserInActiveSimulation()) {
            const lineName = simulation.config.power_system_config.Line_name;
            if (topologyModelCache.has(lineName)) {
              const topologyModel = topologyModelCache.get(lineName);
              this._processModelForRendering(topologyModel);
              this._simulationControlService.syncSimulationSnapshotState({
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
    this._subscribeToTopologyModelTopic(getTopologyModelRequest.replyTo);
    this._stompClientService.send(
      getTopologyModelRequest.url,
      { 'reply-to': getTopologyModelRequest.replyTo },
      JSON.stringify(getTopologyModelRequest.requestBody)
    );
  }

  private _subscribeToTopologyModelTopic(destination: string) {
    this._stompClientService.readOnceFrom(destination)
      .pipe(
        takeWhile(() => !this._activeSimulationStream.closed),
        map(JSON.parse as (body: string) => GetTopologyModelRequestPayload),
        map(payload => typeof payload.data === 'string' ? JSON.parse(payload.data) : payload.data)
      )
      .subscribe({
        next: (topologyModel: TopologyModel) => {
          this._processModelForRendering(topologyModel);
          this._simulationControlService.syncSimulationSnapshotState({
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
    if (!model || model.feeders.length === 0)
      return null;
    const feeder = model.feeders[0];
    const renderableTopology: RenderableTopology = {
      name: feeder.name,
      nodes: [],
      edges: [],
      inverted: false
    };
    const keysToLookAt = [
      'batteries', 'switches', 'solarpanels', 'swing_nodes', 'transformers', 'overhead_lines', 'capacitors', 'regulators'
    ];
    type UnprocessedNode = (
      Node &
      {
        groupName: string;
        x2: number;
        y2: number;
        open: any;
        manual: any;
        from: string;
        to: string
      }
    );
    const allNodeMap = Object.keys(feeder)
      .filter(key => keysToLookAt.includes(key))
      .reduce((accumlator, group) => {
        for (const node of feeder[group]) {
          node.groupName = group;
          accumlator.set(node.name, node);
        }
        return accumlator;
      }, new Map<string, UnprocessedNode>());
    const allNodeList = [...allNodeMap.values()];
    this._convertLatLongToXYIfNeeded(allNodeList);

    for (const node of allNodeList) {
      const groupName = node.groupName;
      const mRIDs = this.props.mRIDs.get(node.name) || [];
      const resolvedMRIDs = Array.isArray(mRIDs) ? mRIDs : [mRIDs];

      delete node.groupName;
      switch (groupName) {
        case 'swing_nodes':
          renderableTopology.nodes.push(
            this._createNewNode({
              ...node,
              name: node.name,
              type: 'swing_node',
              x1: Math.trunc(node.x1),
              y1: Math.trunc(node.y1),
              mRIDs: resolvedMRIDs
            })
          );
          break;
        case 'batteries':
          renderableTopology.nodes.push(
            this._createNewNode({
              ...node,
              name: node.name,
              type: 'battery',
              mRIDs: resolvedMRIDs
            })
          );
          break;
        case 'switches':
          const swjtch = this._createNewNode({
            ...node,
            name: node.name,
            type: 'switch',
            open: node.open === 'open',
            screenX2: 0,
            screenY2: 0,
            colorWhenOpen: '#4aff4a',
            colorWhenClosed: '#f00',
            mRIDs: resolvedMRIDs
          }) as Switch;
          renderableTopology.nodes.push(swjtch);
          this._switches.add(swjtch);
          break;
        case 'solarpanels':
          renderableTopology.nodes.push(
            this._createNewNode({
              ...node,
              name: node.name,
              type: 'solarpanel',
              mRIDs: resolvedMRIDs
            })
          );
          break;
        case 'transformers':
          renderableTopology.nodes.push(
            this._createNewNode({
              ...node,
              name: node.name,
              type: 'transformer',
              x1: Math.trunc(node.x1 !== 0 ? node.x1 : node.x2),
              y1: Math.trunc(node.y1 !== 0 ? node.y1 : node.y2),
              mRIDs: resolvedMRIDs
            })
          );
          break;
        case 'capacitors':
          renderableTopology.nodes.push(
            this._createNewNode({
              ...node,
              name: node.name,
              type: 'capacitor',
              open: node.open === 'open',
              x1: Math.trunc(node.x1),
              y1: Math.trunc(node.y1),
              manual: node.manual === 'manual',
              controlMode: CapacitorControlMode.UNSPECIFIED,
              volt: null,
              var: null,
              mRIDs: resolvedMRIDs
            })
          );
          break;
        case 'overhead_lines':
          const fromNode: Node = allNodeMap.get(node.from) || this._createNewNode({ name: node.from });
          const toNode: Node = allNodeMap.get(node.to) || this._createNewNode({ name: node.to });
          fromNode.x1 = Math.trunc(node.x1);
          fromNode.y1 = Math.trunc(node.y1);
          toNode.x1 = Math.trunc(node.x2);
          toNode.y1 = Math.trunc(node.y2);
          renderableTopology.nodes.push(fromNode, toNode);
          renderableTopology.edges.push({
            ...node,
            name: node.name,
            from: fromNode,
            to: toNode,
          });
          break;
        case 'regulators':
          renderableTopology.nodes.push(
            this._createNewNode({
              ...node,
              name: node.name,
              type: 'regulator',
              x1: Math.trunc(node.x2),
              y1: Math.trunc(node.y2),
              manual: node.manual === 'manual',
              controlModel: RegulatorControlMode.UNSPECIFIED,
              phaseValues: {},
              phases: this.props.phases.get(node.name),
              mRIDs: resolvedMRIDs
            })
          );
          break;
        default:
          console.warn(`${node.groupName} is in the model, but there's no switch case for it. Skipping`);
          break;
      }
    }
    this._resolveCoordinatesInSwitches(allNodeMap);
    return renderableTopology;
  }

  private _convertLatLongToXYIfNeeded(nodes: any[]) {
    const minMax = extent(nodes, node => node.x1);
    if (minMax[1] - minMax[0] <= 1)
      for (const node of nodes) {
        if ('x1' in node) {
          const { x, y } = this._latLongToXY(node.x1, node.y1);
          node.x1 = x;
          node.y1 = y;
        }
        if ('x2' in node) {
          const { x, y } = this._latLongToXY(node.x2, node.y2);
          node.x2 = x;
          node.y2 = y;
        }
      }
  }

  private _latLongToXY(longitude: number, lat: number): { x: number; y: number } {
    return {
      x: Math.floor(136.0 * (longitude + 77.0292) / (-77.0075 + 77.0292)) / 10,
      y: Math.floor(117.0 * (lat - 38.8762) / (38.8901 - 38.8762)) / 10
    };
  }

  private _createNewNode(properties: { [key: string]: any }): Node {
    return {
      x1: -1,
      y1: -1,
      screenX1: 0,
      screenY1: 0,
      name: '',
      type: 'unknown',
      ...properties
    } as Node;
  }

  private _resolveCoordinatesInSwitches(allNodeMap: Map<string, Node>) {
    for (const swjtch of this._switches) {
      const fromNode = allNodeMap.get(swjtch.from);
      swjtch.x1 = Math.trunc(swjtch.x1);
      swjtch.y1 = Math.trunc(swjtch.y1);
      swjtch.x2 = Math.trunc(swjtch.x2);
      swjtch.y2 = Math.trunc(swjtch.y2);
      if (fromNode) {
        swjtch.x1 = fromNode.x1;
        swjtch.y1 = fromNode.y1;
      }
      const toNode = allNodeMap.get(swjtch.to);
      if (toNode) {
        swjtch.x2 = toNode.x1;
        swjtch.y2 = toNode.y1;
      }
    }
  }

  private _toggleSwitchesOnOutputMeasurementsReceived() {
    return this._simulationControlService.simulationOutputMeasurementsReceived()
      .subscribe({
        next: measurements => {
          for (const swjtch of this._switches) {
            measurements.forEach(measurement => {
              if (measurement.conductingEquipmentMRID === swjtch.mRIDs[0] && measurement.type === 'Pos')
                swjtch.open = measurement.value === 0;
            });
            const switchSymbol = document.querySelector(`.topology-renderer__canvas__symbol.switch._${swjtch.name}_`);
            switchSymbol?.setAttribute('fill', swjtch.open ? swjtch.colorWhenOpen : swjtch.colorWhenClosed);
          }
        }
      });
  }

  private _updateRenderableTopologyOnSimulationSnapshotReceived() {
    return this._simulationControlService.selectSimulationSnapshotState('topologyModel')
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

  componentWillUnmount() {
    this._simulationOutputStream.unsubscribe();
    this._simulationSnapshotStream.unsubscribe();
    this._activeSimulationStream.unsubscribe();
  }

  render() {
    return (
      <>
        <TopologyRenderer
          topology={this.state.topology}
          showWait={this.state.isFetching}
          onToggleSwitch={this.onToggleSwitchState}
          onCapacitorMenuFormSubmitted={this.onCapacitorMenuFormSubmitted}
          onRegulatorMenuFormSubmitted={this.onRegulatorMenuFormSubmitted} />
        <Wait show={this.state.isFetching} />
      </>
    );
  }

  onToggleSwitchState(swjtch: Switch, open: boolean) {
    const toggleSwitchStateRequest = new ToggleSwitchStateRequest({
      componentMRID: this.props.mRIDs.get(swjtch.name),
      simulationId: this._simulationQueue.getActiveSimulation().id,
      open,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send(
      toggleSwitchStateRequest.url,
      { 'reply-to': toggleSwitchStateRequest.replyTo },
      JSON.stringify(toggleSwitchStateRequest.requestBody)
    );
  }

  onCapacitorMenuFormSubmitted(currentCapacitor: Capacitor, newCapacitor: Capacitor) {
    switch (newCapacitor.controlMode) {
      case CapacitorControlMode.MANUAL:
        if (currentCapacitor.controlMode !== newCapacitor.controlMode) {
          currentCapacitor.manual = true;
          this._toggleCapacitorManualMode(newCapacitor);
        }
        if (currentCapacitor.open !== newCapacitor.open) {
          currentCapacitor.open = newCapacitor.open;
          this._openOrCloseCapacitor(newCapacitor);
        }
        break;
      case CapacitorControlMode.VAR:
        // Send request only if we switched from manual mode
        if (currentCapacitor.controlMode === CapacitorControlMode.MANUAL) {
          currentCapacitor.manual = false;
          this._toggleCapacitorManualMode(currentCapacitor);
        }
        currentCapacitor.var = newCapacitor.var;
        this._sendCapacitorVarUpdateRequest(currentCapacitor);
        break;
      case CapacitorControlMode.VOLT:
        // Send request only if we switched from manual mode
        if (currentCapacitor.controlMode === CapacitorControlMode.MANUAL) {
          currentCapacitor.manual = false;
          this._toggleCapacitorManualMode(currentCapacitor);
        }
        currentCapacitor.volt = newCapacitor.volt;
        this._sendCapacitorVoltUpdateRequest(currentCapacitor);
        break;
    }
    currentCapacitor.controlMode = newCapacitor.controlMode;
  }

  private _toggleCapacitorManualMode(capacitor: Capacitor) {
    const toggleCapacitorManualModeRequest = new ToggleCapacitorManualModeRequest({
      componentMRID: this.props.mRIDs.get(capacitor.name),
      simulationId: this._simulationQueue.getActiveSimulation().id,
      manual: capacitor.manual,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send(
      toggleCapacitorManualModeRequest.url,
      { 'reply-to': toggleCapacitorManualModeRequest.replyTo },
      JSON.stringify(toggleCapacitorManualModeRequest.requestBody)
    );
  }

  private _openOrCloseCapacitor(capacitor: Capacitor) {
    const openOrCloseCapacitorRequest = new OpenOrCloseCapacitorRequest({
      componentMRID: this.props.mRIDs.get(capacitor.name),
      simulationId: this._simulationQueue.getActiveSimulation().id,
      open: capacitor.open,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send(
      openOrCloseCapacitorRequest.url,
      { 'reply-to': openOrCloseCapacitorRequest.replyTo },
      JSON.stringify(openOrCloseCapacitorRequest.requestBody)
    );
  }

  private _sendCapacitorVarUpdateRequest(capacitor: Capacitor) {
    const capacitorVarUpdateRequest = new CapacitorVarUpdateRequest({
      componentMRID: this.props.mRIDs.get(capacitor.name),
      simulationId: this._simulationQueue.getActiveSimulation().id,
      target: capacitor.var.target,
      deadband: capacitor.var.deadband,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send(
      capacitorVarUpdateRequest.url,
      { 'reply-to': capacitorVarUpdateRequest.replyTo },
      JSON.stringify(capacitorVarUpdateRequest.requestBody)
    );
  }

  private _sendCapacitorVoltUpdateRequest(capacitor: Capacitor) {
    const capacitorVoltUpdateRequest = new CapacitorVoltUpdateRequest({
      componentMRID: this.props.mRIDs.get(capacitor.name),
      simulationId: this._simulationQueue.getActiveSimulation().id,
      target: capacitor.volt.target,
      deadband: capacitor.volt.deadband,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send(
      capacitorVoltUpdateRequest.url,
      { 'reply-to': capacitorVoltUpdateRequest.replyTo },
      JSON.stringify(capacitorVoltUpdateRequest.requestBody)
    );
  }

  onRegulatorMenuFormSubmitted(currentRegulator: Regulator, newRegulator: Regulator) {
    if (currentRegulator.controlMode !== newRegulator.controlMode)
      this._toggleRegulatorManualMode(newRegulator);
    switch (newRegulator.controlMode) {
      case RegulatorControlMode.MANUAL:
        currentRegulator.manual = true;
        this._sendRegulatorTapChangerRequestForAllPhases(newRegulator);
        break;
      case RegulatorControlMode.LINE_DROP_COMPENSATION:
        currentRegulator.manual = false;
        this._sendRegulatorLineDropComponensationRequestForAllPhases(newRegulator);
        break;
    }
    currentRegulator.controlMode = newRegulator.controlMode;
  }

  private _toggleRegulatorManualMode(regulator: Regulator) {
    const toggleRegulatorManualModeRequest = new ToggleRegulatorManualModeRequest({
      componentMRID: this.props.mRIDs.get(regulator.name),
      simulationId: this._simulationQueue.getActiveSimulation().id,
      manual: regulator.manual,
      differenceMRID: this.activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send(
      toggleRegulatorManualModeRequest.url,
      { 'reply-to': toggleRegulatorManualModeRequest.replyTo },
      JSON.stringify(toggleRegulatorManualModeRequest.requestBody)
    );
  }

  private _sendRegulatorTapChangerRequestForAllPhases(regulator: Regulator) {
    this.props.mRIDs.get(regulator.name)
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
        this._stompClientService.send(request.url, { 'reply-to': request.replyTo }, JSON.stringify(request.requestBody));
      });
  }

  private _sendRegulatorLineDropComponensationRequestForAllPhases(regulator: Regulator) {
    this.props.mRIDs.get(regulator.name)
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
        this._stompClientService.send(request.url, { 'reply-to': request.replyTo }, JSON.stringify(request.requestBody));
      });
  }

}
