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
  private _simulationStatusLogSub: Promise<StompSubscription> = null;
  private _simulationStartSubscription: Promise<StompSubscription> = null;

  constructor(props: any) {
    super(props);
    this.state = {
      logMessages: [],
      isFetching: false
    };
  }

  componentDidMount() {
    this._simulationStartSubscription = this._subscribeToSimulationStartedEvent();
  }

  componentWillUnmount() {
    if (this._simulationStartSubscription)
      this._simulationStartSubscription.then(sub => sub.unsubscribe());
    if (this._simulationStatusLogSub)
      this._simulationStatusLogSub.then(sub => sub.unsubscribe());
  }

  render() {
    return <SimulationStatusLogger
      simulationRunning={this.state.isFetching}
      messages={this.state.logMessages}
      isFetching={this.state.isFetching} />;
  }

  private _subscribeToSimulationStartedEvent() {
    return this._simulationControlService.onSimulationStarted((simulationId) => {
      this.setState({ isFetching: true });
      this._simulationStatusLogSub = this._simulationControlService.onSimulationStatusLogReceived(
        simulationId,
        logMessage => {
          this.setState({
            logMessages: this.state.logMessages.concat(logMessage),
            isFetching: false
          });
        }
      );
    });
  }
}