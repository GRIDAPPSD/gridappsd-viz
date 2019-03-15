import * as React from 'react';
import { Subscription } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';

import { TopologyRenderer } from './TopologyRenderer';
import { SimulationQueue } from '@shared/simulation';
import { Node, Edge } from '@shared/topology';
import { StompClientService } from '@shared/StompClientService';
import { Switch, TopologyModel, Capacitor } from '@shared/topology';
import { ToggleCapacitorRequest } from './models/ToggleCapacitorRequest';
import { ToggleSwitchStateRequest } from './models/ToggleSwitchStateRequest';
import { GetTopologyModelRequest, GetTopologyModelRequestPayload } from './models/GetTopologyModelRequest';

interface Props {
  mRIDs: { [componentType: string]: string };
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
    this.onToggleSwitch = this.onToggleSwitch.bind(this);
    this.onToggleCapacitor = this.onToggleCapacitor.bind(this);
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
            y: Math.trunc(node.y1)
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
            y: Math.trunc(node.y2)
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
        onToggleSwitch={this.onToggleSwitch}
        onToggleCapacitor={this.onToggleCapacitor} />
    );
  }

  onToggleSwitch(swjtch: Switch) {
    const toggleSwitchStateRequest = new ToggleSwitchStateRequest({
      command: 'update',
      input: {
        simulation_id: this._simulationQueue.getActiveSimulation().id,
        message: {
          timestamp: Math.floor((new Date).getTime() / 1000.0),
          difference_mrid: this._activeSimulationConfig.power_system_config.Line_name,
          reverse_differences: [
            {
              object: this.props.mRIDs[swjtch.name],
              value: swjtch.open ? '0' : '1',
              attribute: 'Switch.open'
            }
          ],
          forward_differences: [
            {
              object: this.props.mRIDs[swjtch.name],
              value: swjtch.open ? '1' : '0',
              attribute: 'Switch.open'
            }
          ]
        }
      }
    });
    this._stompClientService.send(
      toggleSwitchStateRequest.url,
      { 'reply-to': toggleSwitchStateRequest.replyTo },
      JSON.stringify(toggleSwitchStateRequest.requestBody)
    );
  }

  onToggleCapacitor(capacitor: Capacitor) {
    const toggleCapacitorRequest = new ToggleCapacitorRequest({
      simulation_id: this._simulationQueue.getActiveSimulation().id,
      message: {
        timestamp: Math.floor((new Date).getTime() / 1000.0),
        difference_mrid: this._activeSimulationConfig.power_system_config.Line_name,
        reverse_differences: [
          {
            object: this.props.mRIDs[capacitor.name],
            attribute: 'ShuntCompensator.sections',
            value: capacitor.open ? '1' : '0'
          }
        ],
        forward_differences: [
          {
            object: this.props.mRIDs[capacitor.name],
            attribute: 'ShuntCompensator.sections',
            value: capacitor.open ? '0' : '1'
          }
        ]
      }
    });
    this._stompClientService.send(
      toggleCapacitorRequest.url,
      { 'reply-to': toggleCapacitorRequest.replyTo },
      JSON.stringify(toggleCapacitorRequest.requestBody)
    );
  }

}