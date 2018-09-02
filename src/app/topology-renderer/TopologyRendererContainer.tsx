import * as React from 'react';
import { StompSubscription } from '@stomp/stompjs';
import { Subscription } from 'rxjs';

import { ModelRenderer } from './views/model-renderer/ModelRenderer';
import { MessageService } from '../services/MessageService';
import { TopologyModel } from '../models/topology/TopologyModel';
import { RequestConfigurationType } from '../models/message-requests/RequestConfigurationType';
import { GetTopologyModelRequestPayload } from '../models/message-requests/GetTopologyModelRequest';
import { SimulationQueue } from '../services/SimulationQueue';
import { Node } from './models/Node';
import { Edge } from './models/Edge';

interface Props {
}

interface State {
  topology: { nodes: Node[], edges: Edge[] };
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

  private _transformModel(model: TopologyModel): { nodes: Node[], edges: Edge[] } {
    if (!model || model.feeders.length === 0)
      return null;
    const nodes = [];
    const edges = [];

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
      switch (node.groupName) {
        case 'swing_nodes':
          nodes.push({
            name: node.name,
            type: 'swing_node',
            data: node,
            x: this._truncate(node.x1),
            y: this._truncate(node.y1)
          });
          break;
        case 'batteries':
          nodes.push({
            name: node.name,
            type: 'battery',
            data: node
          });
          break;
        case 'switches':
          if ((node.x1 !== 0 && node.y1 !== 0) || (node.x2 !== 0 && node.y2 !== 0)) {
            nodes.push({
              name: node.name,
              type: 'switch',
              data: node,
              x: this._truncate((node.x1 !== 0) ? node.x1 : node.x2),
              y: this._truncate((node.y1 !== 0) ? node.y1 : node.y2),

            });
          }
          break;
        case 'solarpanels':
          nodes.push({
            name: node.name,
            type: 'solarpanel',
            data: node
          });
          break;
        case 'transformers':
          if ((node.x1 !== 0 && node.y1 !== 0) || (node.x2 !== 0 && node.y2 !== 0)) {
            nodes.push({
              name: node.name,
              type: 'transformer',
              data: node,
              x: this._truncate((node.x1 !== 0) ? node.x1 : node.x2),
              y: this._truncate((node.y1 !== 0) ? node.y1 : node.y2),

            });
          }
          break;
        case 'capacitors':
          nodes.push({
            name: node.name,
            type: 'capacitor',
            data: node,
            x: this._truncate(node.x1),
            y: this._truncate(node.y1)
          });
          break;
        case 'overhead_lines':
          const fromNode = allNodes.filter(e => e.name === node.from)[0] || { name: node.from, type: 'node', data: null };
          const toNode = allNodes.filter(e => e.name === node.to)[0] || { name: node.to, type: 'node', data: null };
          if (node.x1 !== 0.0 && node.y1 !== 0.0 && node.x2 !== 0.0 && node.y2 !== 0.0) {
            fromNode.x = this._truncate(node.x1);
            fromNode.y = this._truncate(node.y1);
            toNode.x = this._truncate(node.x2);
            toNode.y = this._truncate(node.y2);
            nodes.push(fromNode, toNode);
            edges.push({
              name: node.name,
              from: fromNode,
              to: toNode,
              data: node
            });
          }
          break;
        case 'regulators':
          nodes.push({
            name: node.name,
            type: 'regulator',
            data: node,
            x: this._truncate(node.x2),
            y: this._truncate(node.y2)
          });
          break;
        default:
          console.warn(`${node.groupName} is in the model, but there's no switch case for it. Skipping`);
          break;
      }
    }

    return { nodes, edges };
  }

  private _useTopologyModelFromCache() {
    this.setState({
      topology: topologyCache[this._activeSimulationConfig.power_system_config.Line_name],
      isFetching: false
    });
  }

  private _truncate(num: number) {
    return num | 0;
  }
}