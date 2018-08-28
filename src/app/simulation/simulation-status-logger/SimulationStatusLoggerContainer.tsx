import * as React from 'react';
import { StompSubscription } from '@stomp/stompjs';

import { SimulationStatusLogger } from './SimulationStatusLogger';
import { SimulationControlService } from '../../services/SimulationControlService';

interface Props {

}

interface State {
  logMessages: Array<string>;
  isFetching: boolean;
}


export class SimulationStatusLoggerContainer extends React.Component<Props, State> {

  private readonly _simulationControlService = SimulationControlService.getInstance();
  private _simulationStatusLogSub: StompSubscription = null;
  private _simulationStartSubscription: StompSubscription = null;

  constructor(props: any) {
    super(props);
    this.state = {
      logMessages: [],
      isFetching: false
    };
  }

  componentDidMount() {
    this._subscribeToSimulationStartedEvent();
  }

  componentWillUnmount() {
    this._simulationStartSubscription.unsubscribe();
    if (this._simulationStatusLogSub)
      this._simulationStatusLogSub.unsubscribe();
  }

  render() {
    return <SimulationStatusLogger messages={this.state.logMessages} isFetching={this.state.isFetching} />;
  }

  private _subscribeToSimulationStartedEvent() {
    const repeater = setInterval(() => {
      if (this._simulationControlService.isActive()) {
        this._simulationStartSubscription = this._simulationControlService.onSimulationStarted(simulationId => {
          console.log('simulation ID: ' + simulationId);
          this.setState({ isFetching: true });
          this._simulationStatusLogSub = this._simulationControlService.onSimulationStatusLogReceived(
            simulationId,
            logMessage => this.setState({
              logMessages: this.state.logMessages.concat(logMessage),
              isFetching: false
            })
          );
        });
        clearInterval(repeater);
      }
    }, 500);
  }
}