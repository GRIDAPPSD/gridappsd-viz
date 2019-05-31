import * as React from 'react';
import { Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';

import { TopologyRenderer } from './TopologyRenderer';
import { SimulationQueue } from '@shared/simulation';
import { Node, Edge, Regulator, RegulatorControlMode } from '@shared/topology';
import { StompClientService } from '@shared/StompClientService';
import { Switch, TopologyModel, Capacitor } from '@shared/topology';
import { OpenOrCloseCapacitorRequest } from './models/OpenOrCloseCapacitorRequest';
import { ToggleSwitchStateRequest } from './models/ToggleSwitchStateRequest';
import { GetTopologyModelRequest, GetTopologyModelRequestPayload } from './models/GetTopologyModelRequest';
import { ToggleCapacitorManualModeRequest } from './models/ToggleCapacitorManualModeRequest';
import { ToggleRegulatorManualModeRequest } from './models/ToggleRegulatorManualModeRequest';
import { CapacitorControlMode } from '@shared/topology';
import { CapacitorVarUpdateRequest } from './models/CapacitorVarUpdateRequest';
import { CapacitorVoltUpdateRequest } from './models/CapacitorVoltUpdateRequest';
import { RegulatorLineDropUpdateRequest } from './models/RegulatorLineDropUpdateRequest';
import { RegulatorTapChangerRequest } from './models/RegulatorTapChangerRequest';

interface Props {
  mRIDs: Map<string, string & string[]>;
  phases: Map<string, string[]>;
}

interface State {
  topology: { nodes: Node[], edges: Edge[] };
  isFetching: boolean;
}

export class TopologyRendererContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private _activeSimulationConfig = this._simulationQueue.getActiveSimulation().config;
  private _activeSimulationStream: Subscription = null;
  private static readonly _CACHE = {};

  constructor(props: any) {
    super(props);
    this.state = {
      topology: null,
      isFetching: true
    };
    this.onToggleSwitchState = this.onToggleSwitchState.bind(this);
    this.onCapacitorMenuFormSubmitted = this.onCapacitorMenuFormSubmitted.bind(this);
    this.onRegulatorMenuFormSubmitted = this.onRegulatorMenuFormSubmitted.bind(this);
  }

  componentDidMount() {
    this._activeSimulationStream = this._observeActiveSimulationChangeEvent();
  }

  private _observeActiveSimulationChangeEvent() {
    return this._simulationQueue.activeSimulationChanged()
      .pipe(takeWhile(() => this._activeSimulationStream === null))
      .subscribe({
        next: simulation => {
          this._activeSimulationConfig = simulation.config;
          if (this._topologyModelExistsInCache())
            this._useTopologyModelFromCache();
          else
            this._fetchTopologyModel();
        }
      });
  }
  private _topologyModelExistsInCache() {
    return this._activeSimulationConfig && this._activeSimulationConfig.power_system_config.Line_name in TopologyRendererContainer._CACHE;
  }

  private _useTopologyModelFromCache() {
    this.setState({
      topology: TopologyRendererContainer._CACHE[this._activeSimulationConfig.power_system_config.Line_name],
      isFetching: false
    });
  }

  private _fetchTopologyModel() {
    const lineName = this._activeSimulationConfig.power_system_config.Line_name;
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
      .pipe(map(body => JSON.parse(body) as GetTopologyModelRequestPayload))
      .subscribe({
        next: payload => this._processModelForRendering(payload)
      });
  }

  private _processModelForRendering(payload: GetTopologyModelRequestPayload) {
    if (typeof payload.data === 'string')
      payload.data = JSON.parse(payload.data);
    const topology = this._transformModel(payload.data);
    this.setState({
      topology,
      isFetching: false
    });
    TopologyRendererContainer._CACHE[this._activeSimulationConfig.power_system_config.Line_name] = topology;
  }

  private _transformModel(model: TopologyModel): { nodes: Node[], edges: Edge[] } {
    if (!model || model.feeders.length === 0)
      return null;
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const groupNames = ['batteries', 'switches', 'solarpanels', 'swing_nodes', 'transformers', 'overhead_lines',
      'capacitors', 'regulators'
    ];
    const feeder = model.feeders[0];
    const allNodes = Object.keys(feeder)
      .filter(key => groupNames.includes(key))
      .reduce((allNodes, group) => {
        feeder[group].forEach(node => {
          node.groupName = group;
          allNodes.push(node);
        });
        return allNodes;
      }, []);
    for (const node of allNodes) {
      const groupName = node.groupName;
      delete node.groupName;
      switch (groupName) {
        case 'swing_nodes':
          nodes.push(this._createNewNode({
            ...node,
            name: node.name,
            type: 'swing_node',
            x: Math.trunc(node.x1),
            y: Math.trunc(node.y1)
          }));
          break;
        case 'batteries':
          nodes.push(this._createNewNode({
            ...node,
            name: node.name,
            type: 'battery'
          }));
          break;
        case 'switches':
          if ((node.x1 !== 0 && node.y1 !== 0) || (node.x2 !== 0 && node.y2 !== 0)) {
            nodes.push(this._createNewNode({
              ...node,
              name: node.name,
              type: 'switch',
              open: node.open === 'open',
              x: Math.trunc(node.x1 !== 0 ? node.x1 : node.x2),
              y: Math.trunc(node.y1 !== 0 ? node.y1 : node.y2),
            }));
          }
          break;
        case 'solarpanels':
          nodes.push(this._createNewNode({
            ...node,
            name: node.name,
            type: 'solarpanel'
          }));
          break;
        case 'transformers':
          if ((node.x1 !== 0 && node.y1 !== 0) || (node.x2 !== 0 && node.y2 !== 0)) {
            nodes.push(this._createNewNode({
              ...node,
              name: node.name,
              type: 'transformer',
              x: Math.trunc(node.x1 !== 0 ? node.x1 : node.x2),
              y: Math.trunc(node.y1 !== 0 ? node.y1 : node.y2)
            }));
          }
          break;
        case 'capacitors':
          nodes.push(this._createNewNode({
            ...node,
            name: node.name,
            type: 'capacitor',
            open: node.open === 'open',
            x: Math.trunc(node.x1),
            y: Math.trunc(node.y1),
            manual: node.manual === 'manual',
            controlMode: CapacitorControlMode.UNSPECIFIED,
            volt: null,
            var: null
          }));
          break;
        case 'overhead_lines':
          const fromNode: Node = allNodes.filter(e => e.name === node.from)[0] || this._createNewNode({ name: node.from });
          const toNode: Node = allNodes.filter(e => e.name === node.to)[0] || this._createNewNode({ name: node.to });
          if (node.x1 !== 0.0 && node.y1 !== 0.0 && node.x2 !== 0.0 && node.y2 !== 0.0) {
            fromNode.x = Math.trunc(node.x1);
            fromNode.y = Math.trunc(node.y1);
            toNode.x = Math.trunc(node.x2);
            toNode.y = Math.trunc(node.y2);
            nodes.push(fromNode, toNode);
            edges.push({
              ...node,
              name: node.name,
              from: fromNode,
              to: toNode,
            });
          }
          break;
        case 'regulators':
          nodes.push(this._createNewNode({
            ...node,
            name: node.name,
            type: 'regulator',
            x: Math.trunc(node.x2),
            y: Math.trunc(node.y2),
            manual: node.manual === 'manual',
            controlModel: RegulatorControlMode.UNSPECIFIED,
            phaseValues: {},
            phases: this.props.phases.get(node.name)
          }));
          break;
        default:
          console.warn(`${node.groupName} is in the model, but there's no switch case for it. Skipping`);
          break;
      }
    }

    return {
      nodes: nodes.filter(node => node.x !== -1 && node.y !== -1),
      edges: edges.filter(edge => [edge.from.x, edge.from.y, edge.to.x, edge.to.y].every(e => e !== -1))
    };
  }

  private _createNewNode(properties: { [key: string]: any }): Node {
    return {
      x: -1,
      y: -1,
      screenX: 0,
      screenY: 0,
      name: '',
      type: 'unknown',
      ...properties
    } as Node;
  }

  componentWillUnmount() {
    this._activeSimulationStream.unsubscribe();
  }

  render() {
    return (
      <TopologyRenderer
        topology={this.state.topology}
        showWait={this.state.isFetching}
        topologyName={this._activeSimulationConfig.simulation_config.simulation_name}
        onToggleSwitch={this.onToggleSwitchState}
        onCapacitorMenuFormSubmitted={this.onCapacitorMenuFormSubmitted}
        onRegulatorMenuFormSubmitted={this.onRegulatorMenuFormSubmitted} />
    );
  }

  onToggleSwitchState(swjtch: Switch) {
    const toggleSwitchStateRequest = new ToggleSwitchStateRequest({
      componentMRID: this.props.mRIDs.get(swjtch.name),
      simulationId: this._simulationQueue.getActiveSimulation().id,
      open: swjtch.open,
      differenceMRID: this._activeSimulationConfig.power_system_config.Line_name
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
          currentCapacitor.manual = newCapacitor.manual;
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
        currentCapacitor.controlMode = CapacitorControlMode.VAR;
        currentCapacitor.var = newCapacitor.var;
        this._sendCapacitorVarUpdateRequest(currentCapacitor);
        break;
      case CapacitorControlMode.VOLT:
        // Send request only if we switched from manual mode
        if (currentCapacitor.controlMode === CapacitorControlMode.MANUAL) {
          currentCapacitor.manual = false;
          this._toggleCapacitorManualMode(currentCapacitor);
        }
        currentCapacitor.controlMode = CapacitorControlMode.VOLT;
        currentCapacitor.volt = newCapacitor.volt;
        this._sendCapacitorVoltUpdateRequest(currentCapacitor);
        break;
    }
  }

  private _toggleCapacitorManualMode(capacitor: Capacitor) {
    const toggleCapacitorManualModeRequest = new ToggleCapacitorManualModeRequest({
      componentMRID: this.props.mRIDs.get(capacitor.name),
      simulationId: this._simulationQueue.getActiveSimulation().id,
      manual: capacitor.manual,
      differenceMRID: this._activeSimulationConfig.power_system_config.Line_name
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
      differenceMRID: this._activeSimulationConfig.power_system_config.Line_name
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
      differenceMRID: this._activeSimulationConfig.power_system_config.Line_name
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
      target: capacitor.var.target,
      deadband: capacitor.var.deadband,
      differenceMRID: this._activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send(
      capacitorVoltUpdateRequest.url,
      { 'reply-to': capacitorVoltUpdateRequest.replyTo },
      JSON.stringify(capacitorVoltUpdateRequest.requestBody)
    );
  }

  onRegulatorMenuFormSubmitted(currentRegulator: Regulator, newRegulator: Regulator) {
    switch (newRegulator.controlMode) {
      case RegulatorControlMode.MANUAL:
        if (currentRegulator.controlMode !== newRegulator.controlMode) {
          currentRegulator.controlMode = newRegulator.controlMode;
          this._toggleRegulatorManualMode(newRegulator);
          this._sendRegulatorTapChangerRequestForAllPhases(newRegulator);
        }
        break;
      case RegulatorControlMode.LINE_DROP_COMPENSATION:
        if (currentRegulator.controlMode !== newRegulator.controlMode) {
          currentRegulator.controlMode = newRegulator.controlMode;
          this._sendRegulatorLineDropComponensationRequestForAllPhases(newRegulator);
        }
        break;
    }

  }

  private _toggleRegulatorManualMode(regulator: Regulator) {
    const toggleRegulatorManualModeRequest = new ToggleRegulatorManualModeRequest({
      componentMRID: this.props.mRIDs.get(regulator.name),
      simulationId: this._simulationQueue.getActiveSimulation().id,
      manual: regulator.manual,
      differenceMRID: this._activeSimulationConfig.power_system_config.Line_name
    });
    this._stompClientService.send(
      toggleRegulatorManualModeRequest.url,
      { 'reply-to': toggleRegulatorManualModeRequest.replyTo },
      JSON.stringify(toggleRegulatorManualModeRequest.requestBody)
    );
  }

  private _sendRegulatorLineDropComponensationRequestForAllPhases(regulator: Regulator) {
    this.props.mRIDs.get(regulator.name)
      .map((mRID, index) => {
        const phase = regulator.phases[index];
        const phaseValue = regulator.phaseValues[phase];
        return new RegulatorLineDropUpdateRequest({
          mRID,
          simulationId: this._simulationQueue.getActiveSimulation().id,
          differenceMRID: this._activeSimulationConfig.power_system_config.Line_name,
          lineDropR: phaseValue.lineDropR,
          lineDropX: phaseValue.lineDropX,
          phase
        });
      })
      .forEach(request => {
        this._stompClientService.send(request.url, { 'reply-to': request.replyTo }, JSON.stringify(request.requestBody));
      });
  }

  private _sendRegulatorTapChangerRequestForAllPhases(regulator: Regulator) {
    this.props.mRIDs.get(regulator.name)
      .map((mRID, index) => {
        const phase = regulator.phases[index];
        const phaseValue = regulator.phaseValues[phase];
        return new RegulatorTapChangerRequest({
          mRID,
          simulationId: this._simulationQueue.getActiveSimulation().id,
          differenceMRID: this._activeSimulationConfig.power_system_config.Line_name,
          phase,
          tapValue: phaseValue.tap
        });
      })
      .forEach(request => {
        this._stompClientService.send(request.url, { 'reply-to': request.replyTo }, JSON.stringify(request.requestBody));
      });
  }

}