import * as React from 'react';
import { Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';

import { TopologyRenderer } from './TopologyRenderer';
import { SimulationQueue, SimulationOutputService } from '@shared/simulation';
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
import { RenderableTopology } from './models/RenderableTopology';
import { waitUntil } from '@shared/misc';
import { Wait } from '@shared/wait';

interface Props {
  mRIDs: Map<string, string & string[]>;
  phases: Map<string, string[]>;
}

interface State {
  topology: RenderableTopology;
  isFetching: boolean;
}

export class TopologyRendererContainer extends React.Component<Props, State> {

  private static readonly _CACHE = {};

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _switches = new Set<Switch>();

  private _activeSimulationConfig = this._simulationQueue.getActiveSimulation()
    ? this._simulationQueue.getActiveSimulation().config
    : null;
  private _activeSimulationStream: Subscription = null;
  private _simulationOutputStream: Subscription = null;

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
    this._simulationOutputStream = this._simulationOutputService.simulationOutputMeasurementsReceived()
      .subscribe({
        next: measurements => {
          for (const swjtch of this._switches) {
            measurements.forEach(measurement => {
              if (measurement.conductingEquipmentMRID === swjtch.mRIDs[0] && measurement.type === 'Pos')
                swjtch.open = measurement.value === 0;
            });
            const switchSymbol = document.querySelector(`.topology-renderer__canvas__symbol.switch._${swjtch.name}_`);
            if (switchSymbol)
              switchSymbol.setAttribute('fill', swjtch.open ? swjtch.colorWhenOpen : swjtch.colorWhenClosed);
          }
        }
      });
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
      .pipe(
        takeWhile(() => !this._activeSimulationStream.closed),
        map(body => JSON.parse(body) as GetTopologyModelRequestPayload))
      .subscribe({
        next: payload => this._processModelForRendering(payload)
      });
  }

  private _processModelForRendering(payload: GetTopologyModelRequestPayload) {
    if (typeof payload.data === 'string')
      payload.data = JSON.parse(payload.data);
    waitUntil(() => this.props.mRIDs.size > 0)
      .then(() => {
        const topology = this._transformModelForRendering(payload.data);
        this.setState({
          topology,
          isFetching: false
        });
        TopologyRendererContainer._CACHE[this._activeSimulationConfig.power_system_config.Line_name] = topology;
      });
  }

  private _transformModelForRendering(model: TopologyModel): RenderableTopology {
    if (!model || model.feeders.length === 0)
      return null;
    const edges: Edge[] = [];
    const renderableTopology: RenderableTopology = {
      nodes: [],
      edges
    };
    const keysToLookAt = [
      'batteries', 'switches', 'solarpanels', 'swing_nodes', 'transformers', 'overhead_lines', 'capacitors', 'regulators'
    ];
    const oldModels = [
      'acep_psil', 'ieee123', 'ieee123pv', 'ieee13nodeckt', 'ieee13nodecktassets', 'ieee8500', 'j1', 'sourceckt'
    ];
    const feeder = model.feeders[0];
    const allNodes = Object.keys(feeder)
      .filter(key => keysToLookAt.includes(key))
      .reduce((accumlator, group) => {
        for (const node of feeder[group]) {
          // Newer models overload x1/y1, x2/y2 for longitude/latitude
          // while the older models do not use x1/y1, x2/y2 for longitude/latitude
          // so we need to convert longitude/latitude to x/y when we get a new model
          if (!oldModels.includes(feeder.name)) {
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
          node.groupName = group;
          accumlator.push(node);
        }
        return accumlator;
      }, []);
    for (const node of allNodes) {
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
          if (node.x1 > node.x2) {
            const temp = node.x1;
            node.x1 = node.x2;
            node.x2 = temp;
          }
          if (node.y1 > node.y2) {
            const temp = node.y1;
            node.y1 = node.y2;
            node.y2 = temp;
          }
          const swjtch = this._createNewNode({
            ...node,
            name: node.name,
            type: 'switch',
            open: node.open === 'open',
            x1: Math.trunc(node.x1 !== 0 ? node.x1 : node.x2),
            y1: Math.trunc(node.y1 !== 0 ? node.y1 : node.y2),
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
          const fromNode: Node = allNodes.find(e => e.name === node.from) || this._createNewNode({ name: node.from });
          const toNode: Node = allNodes.find(e => e.name === node.to) || this._createNewNode({ name: node.to });
          fromNode.x1 = Math.trunc(node.x1);
          fromNode.y1 = Math.trunc(node.y1);
          toNode.x1 = Math.trunc(node.x2);
          toNode.y1 = Math.trunc(node.y2);
          renderableTopology.nodes.push(fromNode, toNode);
          edges.push({
            ...node,
            name: node.name,
            from: fromNode,
            to: toNode,
          });
          // }
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
    return renderableTopology;
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

  componentWillUnmount() {
    this._activeSimulationStream.unsubscribe();
    this._simulationOutputStream.unsubscribe();
  }

  render() {
    return (
      <>
        <TopologyRenderer
          topology={this.state.topology}
          showWait={this.state.isFetching}
          topologyName={this._activeSimulationConfig.simulation_config.simulation_name}
          onToggleSwitch={this.onToggleSwitchState}
          onCapacitorMenuFormSubmitted={this.onCapacitorMenuFormSubmitted}
          onRegulatorMenuFormSubmitted={this.onRegulatorMenuFormSubmitted} />
        <Wait show={this.state.isFetching} />
      </>
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
      target: capacitor.volt.target,
      deadband: capacitor.volt.deadband,
      differenceMRID: this._activeSimulationConfig.power_system_config.Line_name
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
      differenceMRID: this._activeSimulationConfig.power_system_config.Line_name
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
          differenceMRID: this._activeSimulationConfig.power_system_config.Line_name,
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

}
