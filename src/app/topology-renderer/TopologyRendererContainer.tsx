import * as React from 'react';
import { StompSubscription } from '@stomp/stompjs';
import { Subscription } from 'rxjs';

import { ModelRenderer } from './views/model-renderer/ModelRenderer';
import { MessageService } from '../services/MessageService';
import { TopologyModel } from '../models/topology/TopologyModel';
import { RequestConfigurationType } from '../models/message-requests/RequestConfigurationType';
import { GetTopologyModelRequestPayload } from '../models/message-requests/GetTopologyModelRequest';
import { SimulationQueue } from '../services/SimulationQueue';

interface Props {
}

interface State {
  topology: { nodes: any[], links: any[] };
  isFetching: boolean;
}

const topologyCache = {};

export class TopologyRendererContainer extends React.Component<Props, State> {

  private readonly _messageService = MessageService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private _activeSimulationConfig = this._simulationQueue.getActiveSimulation().config;
  private _activeSimulationWatcher: Subscription;
  private _topologySubscription: StompSubscription;

  constructor(props: any) {
    super(props);
    this.state = {
      topology: null,
      isFetching: true
    };
  }

  componentDidMount() {
    this._subscribeToTopologyModelTopic();
    this._subscribeToActiveSimulationStream();
    if (this._topologyModelExistsInCache())
      this._useTopologyModelFromCache();
    else
      this._messageService.fetchTopologyModel(this._activeSimulationConfig.power_system_config.Line_name);
  }

  componentWillUnmount() {
    this._topologySubscription.unsubscribe();
    this._activeSimulationWatcher.unsubscribe();
  }

  render() {
    return (
      <ModelRenderer
        topology={this.state.topology}
        showWait={this.state.isFetching}
        topologyName={this._activeSimulationConfig.simulation_config.simulation_name} />
    );
  }

  private _processModelForRendering(payload: GetTopologyModelRequestPayload) {
    if (typeof payload.data === 'string')
      payload.data = JSON.parse(payload.data);
    const topology = this._transformModel(payload.data);
    this.setState({
      topology,
      isFetching: false
    });
    topologyCache[this._activeSimulationConfig.power_system_config.Line_name] = topology;
  }

  private _subscribeToActiveSimulationStream() {
    this._activeSimulationWatcher = this._simulationQueue.activeSimulationChanged()
      .subscribe(simulation => {
        if (this._topologyModelExistsInCache())
          this._useTopologyModelFromCache();
        else {
          this._activeSimulationConfig = simulation.config;
          this._messageService.fetchTopologyModel(simulation.config.power_system_config.Line_name);
        }
      });
  }

  private _subscribeToTopologyModelTopic() {
    this._topologySubscription = this._messageService.onTopologyModelReceived((payload: GetTopologyModelRequestPayload) => {
      if (payload.requestType === RequestConfigurationType.GRID_LAB_D_SYMBOLS)
        this._processModelForRendering(payload);
    });
  }

  private _topologyModelExistsInCache() {
    return this._activeSimulationConfig && this._activeSimulationConfig.power_system_config.Line_name in topologyCache;
  }

  private _transformModel(model: TopologyModel, ): { nodes: any[], links: any[] } {
    if (!model || model.feeders.length === 0)
      return null;
    const knownNodesByName = {};
    const nodes = [];
    const links = [];

    const regulatorParentsPerSimulatioName = {
      ieee8500: {
        VREG3: 'l2692633',
        VREG4: 'm1089120',
        VREG2: 'l2841632',
        FEEDER_REG: 'm1209814'
      },
      ieee123: {
        reg2: '9r',
        reg3: '25r',
        reg4: '160r'
      }
    }

    const groupNames = ['batteries', 'switches', 'solarpanels', 'swing_nodes', 'transformers', 'overhead_lines',
      'capacitors', 'regulators'
    ];
    // Create top-level elements
    const feeder = model.feeders[0];
    for (const groupName of groupNames) {
      switch (groupName) {
        case 'swing_nodes':
        case 'transformers':
          for (const element of feeder[groupName])
            nodes.push({
              name: element.name,
              type: groupName === 'swing_nodes' ? 'swing-node' : 'transformer',
              data: element,
              children: []
            });
          break;
        case 'capacitors':
          for (const capacitor of feeder[groupName]) {
            const parent = knownNodesByName[capacitor.parent];
            if (parent)
              parent.children.push({
                name: capacitor.name,
                type: 'capacitor',
                data: capacitor,
                children: []
              });
            else
              console.log('Missing capacitor parent ' + capacitor.parent);
          }
          break;
        case 'overhead_lines':
          for (const overheadLine of feeder[groupName]) {
            const fromNode = _getOrCreateElement(overheadLine.from, 'node', knownNodesByName);
            const toNode = _getOrCreateElement(overheadLine.to, 'node', knownNodesByName);
            nodes.push(fromNode, toNode);
            if (overheadLine.x1 !== 0.0 && overheadLine.y1 !== 0.0 && overheadLine.x2 !== 0.0 && overheadLine.y2 !== 0.0) {
              fromNode.x = overheadLine.x1;
              fromNode.y = overheadLine.y1;
              toNode.x = overheadLine.x2;
              toNode.y = overheadLine.y2;
            }
            links.push({
              name: overheadLine.name,
              from: fromNode,
              to: toNode,
              data: overheadLine
            });
          }
          break;
        case 'regulators':
          const simulationName = this._activeSimulationConfig.simulation_config.simulation_name;

          for (const regulator of feeder[groupName]) {
            const parent = knownNodesByName[regulatorParentsPerSimulatioName[simulationName][regulator.name]];
            if (parent)
              parent.children.push({
                name: regulator.name,
                type: 'regulator',
                data: regulator,
                children: []
              });
            else
              console.log('Missing regulator parent ' + regulatorParentsPerSimulatioName[simulationName][regulator.name] + ' for ' + regulator.name);
          }
          break;
        default:
          console.warn(`${groupName} is in the model, but there's no switch case for it. Skipping`);
          break;
      }
    }

    return { nodes, links };
  }

  private _useTopologyModelFromCache() {
    this.setState({
      topology: topologyCache[this._activeSimulationConfig.power_system_config.Line_name],
      isFetching: false
    });
  }
}



function _getOrCreateElement(name, type, map) {
  let existingNode = map[name];
  if (!existingNode) {
    existingNode = { name, type, data: {}, children: [] };
    map[name] = existingNode;
  }
  return existingNode;
}