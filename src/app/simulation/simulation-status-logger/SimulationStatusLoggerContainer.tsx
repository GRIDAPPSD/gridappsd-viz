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
    if (this._simulationStartSubscription) {
      this._simulationStartSubscription.unsubscribe();
      console.log('[SimulationStatusLoggerContainer] Unsubscribed from onSimulationStarted');

    }
    if (this._simulationStatusLogSub)
      this._simulationStatusLogSub.unsubscribe();
  }

  render() {
    return <SimulationStatusLogger
      simulationRunning={this.state.isFetching}
      messages={this.state.logMessages}
      isFetching={this.state.isFetching} />;
  }

  private _subscribeToSimulationStartedEvent() {
    this._simulationControlService.onSimulationStarted((simulationId, sub) => {
      console.log('simulation ID: ' + simulationId);
      console.log('[SimulationStatusLoggerContainer] Subscribed to onSimulationStarted');
      this.setState({ isFetching: true });
      this._simulationControlService.onSimulationStatusLogReceived(
        simulationId,
        (logMessage, innerSub) => {
          this.setState({
            logMessages: this.state.logMessages.concat(logMessage),
            isFetching: false
          });
          this._simulationStatusLogSub = innerSub;
        }
      );
      this._simulationStartSubscription = sub
    });
  }
}