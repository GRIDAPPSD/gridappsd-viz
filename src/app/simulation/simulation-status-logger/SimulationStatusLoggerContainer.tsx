import * as React from 'react';
import { Subscription } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';

import { SimulationStatusLogger } from './SimulationStatusLogger';
import {
  SimulationQueue, SIMULATION_STATUS_LOG_TOPIC, SimulationControlService, SimulationStatus
} from '@shared/simulation';
import { StompClientService } from '@shared/StompClientService';
import { StateStore } from '@shared/state-store';

interface Props {

}

interface State {
  logMessages: Array<string>;
  isFetching: boolean;
}


export class SimulationStatusLogContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private _statusLogMessageStreamSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      logMessages: [],
      isFetching: false
    };

    this._newObservableForLogMessages = this._newObservableForLogMessages.bind(this);
    this._onSimulationStatusLogMessageReceived = this._onSimulationStatusLogMessageReceived.bind(this);
  }

  componentDidMount() {
    this._statusLogMessageStreamSubscription = this._subscribeToSimulationStatusLogMessageStream();
  }

  private _subscribeToSimulationStatusLogMessageStream() {
    return this._stompClientService.statusChanges()
      .pipe(
        filter(status => status === 'CONNECTED'),
        switchMap(() => this._stateStore.select('simulationId')),
        filter(simulationId => simulationId !== ''),
        tap(simulationId => {
          this.setState({
            isFetching: true
          });
          this._simulationQueue.updateIdOfActiveSimulation(simulationId);
        }),
        switchMap(this._newObservableForLogMessages)
      )
      .subscribe({
        next: this._onSimulationStatusLogMessageReceived
      });
  }

  private _newObservableForLogMessages(simulationId: string) {
    this.setState({
      logMessages: []
    });

    return this._stompClientService.readFrom(`${SIMULATION_STATUS_LOG_TOPIC}.${simulationId}`)
      .pipe(
        filter(() => this._simulationControlService.currentStatus() === SimulationStatus.STARTED)
      );
  }

  private _onSimulationStatusLogMessageReceived(logMessage: string) {
    this.setState({
      logMessages: [logMessage].concat(this.state.logMessages),
      isFetching: false
    });
  }

  componentWillUnmount() {
    this._statusLogMessageStreamSubscription.unsubscribe();
  }

  render() {
    return (
      <SimulationStatusLogger
        simulationRunning={this.state.isFetching}
        messages={this.state.logMessages}
        isFetching={this.state.isFetching} />
    );
  }

}
