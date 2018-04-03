import * as React from 'react';
import { connect } from 'react-redux';

import { AppState } from '../../models/AppState';
import { Simulation } from '../../models/Simulation';
import { Main } from './Main';
import { SetActiveSimulationConfig, AddSimulation } from '../../actions/simulation-actions';
import { SimulationConfig } from '../../models/SimulationConfig';
import { MessageService } from '../../services/MessageService';

interface Props {
  previousSimulations: Simulation[];
  dispatch: any;
}

interface State {
}

const mapStateToProps = (state: AppState): Props => ({
  previousSimulations: state.previousSimulations
} as Props);

const MESSAGE_SERVICE = MessageService.getInstance();

export const MainContainer = connect(mapStateToProps)(class extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <Main
        previousSimulations={this.props.previousSimulations}
        onPreviousSimulationSelected={(simulation: Simulation) => this.props.dispatch(new SetActiveSimulationConfig(simulation.config))}
        onSimulationConfigFormSubmitted={(simulationConfig: SimulationConfig) => {
          this.props.dispatch(new AddSimulation({
            name: simulationConfig.simulation_config.simulation_name,
            config: simulationConfig,
            id: simulationConfig.simulation_config.simulation_name
          }));
          this.props.dispatch(new SetActiveSimulationConfig(simulationConfig));
          // Wait until TopologyModelRendererContainer component is mounted before requesting the data
          setTimeout(() => MESSAGE_SERVICE.requestTopologyModel(), 1000);
        }}
      />
    );
  }
});