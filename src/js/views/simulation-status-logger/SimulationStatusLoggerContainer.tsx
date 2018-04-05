import * as React from 'react';
import { connect } from 'react-redux';
import { StompSubscription } from '@stomp/stompjs';

import { SimulationStatusLogger } from './SimulationStatusLogger';
import { SimulationControlService } from '../../services/SimulationControlService';
import { SimulationConfig } from '../../models/SimulationConfig';
import { AppState } from '../../models/AppState';

interface Props {
  dispatch: any;
  activeSimulationConfig: SimulationConfig;
}

interface State {
  logMessages: Array<string>;
  isFetching: boolean;
}

const mapStateToProps = (state: AppState): Props => ({
  activeSimulationConfig: state.activeSimulationConfig
} as Props);

const SIMULATION_CONTROL_SERVICE = SimulationControlService.getInstance();
let simulationStartSubscription: StompSubscription = null;
let simulationStatusLogSub: StompSubscription = null;
let fncsSubscription: StompSubscription = null;

export const SimulationStatusLoggerContainer = connect(mapStateToProps)(class SimulationStatusLoggerContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      logMessages: [],
      isFetching: false
    };
  }

  componentDidMount() {
    if (simulationStartSubscription) {
      simulationStartSubscription.unsubscribe();
      simulationStartSubscription = null;
    }
    if (simulationStatusLogSub) {
      simulationStatusLogSub.unsubscribe();
      simulationStatusLogSub = null;
    }
    if (fncsSubscription) {
      fncsSubscription.unsubscribe();
      fncsSubscription = null;
    }

    simulationStartSubscription = SIMULATION_CONTROL_SERVICE.onSimulationStarted(simulationId => {
      console.log('simulation ID: ' + simulationId);
      this.setState({ isFetching: true });
      simulationStatusLogSub = SIMULATION_CONTROL_SERVICE.onSimulationStatusLogReceived(
        simulationId,
        logMessage => this.setState({
          logMessages: this.state.logMessages.concat(logMessage),
          isFetching: false
        })
      );
    });

    fncsSubscription = SIMULATION_CONTROL_SERVICE.onFncsOutputReceived(data => {
      console.log('====================================')
      console.log(data);
      console.log('====================================')
    });
  }

  render() {
    return <SimulationStatusLogger messages={this.state.logMessages} isFetching={this.state.isFetching} />;
  }

});