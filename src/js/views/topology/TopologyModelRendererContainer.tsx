import * as React from 'react';
import { connect } from 'react-redux';
import { StompSubscription } from '@stomp/stompjs';

import { TopologyModelRenderer } from './TopologyModelRenderer';
import { MessageService } from '../../services/MessageService';
import { TopologyModel } from '../../models/topology/TopologyModel';
import { SimulationControlService } from '../../services/SimulationControlService';
import { AppState } from '../../models/AppState';
import { SimulationConfig } from '../../models/SimulationConfig';

import './TopologyModelRenderer.styles.scss';
interface Props {
  simulationConfig: SimulationConfig;
}

interface State {
  renderModel: TopologyModel;
  isFetching: boolean;
}

const mapStateToProps = (state: AppState): Props => ({
  simulationConfig: state.activeSimulationConfig
} as Props);

const MESSAGE_SERVICE = MessageService.getInstance();
const SIMULATION_CONTROL_SERVICE = SimulationControlService.getInstance();
let subscription: StompSubscription = null;

export const TopologyModelRendererContainer = connect(mapStateToProps)(class TopologyModelRendererContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      renderModel: null,
      isFetching: true
    };
  }

  componentDidMount() {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
    subscription = MESSAGE_SERVICE.onTopologyModelReceived((payload) => {
      this.setState({
        renderModel: payload.data,
        isFetching: false
      });
    });
  }

  render() {
    return (
      <TopologyModelRenderer
        model={_transformModel(this.state.renderModel)}
        isFetching={this.state.isFetching}
        onStartSimulation={() => SIMULATION_CONTROL_SERVICE.startSimulation(this.props.simulationConfig)}
        />
    );
  }
});

function _transformModel(model: TopologyModel): { nodes: any[], links: any[] } {
  if (!model || model.feeders.length === 0)
    return null;
  const knownNodesByName = {};
  const nodes = [];
  const links = [];

  const regulatorParents = {
    reg_VREG3: 'nd_l2692633',
    reg_VREG4: 'nd_m1089120',
    reg_VREG2: 'nd_l2841632',
    reg_FEEDER_REG: 'nd_m1209814'
  };

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
            type: feeder[groupName].type,
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
              type: 'capacitors',
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
        for (const regulator of feeder[groupName]) {
          const parent = knownNodesByName[regulatorParents[regulator.name]];
          if (parent)
            parent.children.push({
              name: regulator.name,
              type: 'regulators',
              data: regulator,
              children: []
            });
          else
            console.log('Missing regulator parent ' + regulatorParents[regulator.name] + ' for ' + regulator.name);
        }
        break;
      default:
        console.warn(`${groupName} is in the model, but there's no switch case for it. Skipping`);
        break;
    }
  }

  return { nodes, links };
}

function _getOrCreateElement(name, type, map) {
  let existingNode = map[name];
  if (!existingNode) {
    existingNode = { name, type, data: {}, children: [] };
    map[name] = existingNode;
  }
  return existingNode;
}