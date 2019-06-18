import * as React from 'react';
import { Subscription } from 'rxjs';
import { filter, switchMap, tap, map, takeWhile } from 'rxjs/operators';

import { SimulationStatusLogger } from './SimulationStatusLogger';
import {
  SimulationQueue, START_SIMULATION_TOPIC, SIMULATION_STATUS_LOG_TOPIC, SimulationControlService, SimulationStatus
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
  private _stateStoreChangeSubscription: Subscription;
  private _stompClientStatusSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      logMessages: [],
      isFetching: false
    };

    this._newObservableToReadSimulationId = this._newObservableToReadSimulationId.bind(this);
    this._newObservableForLogMessages = this._newObservableForLogMessages.bind(this);
    this._onSimulationStatusLogMessageReceived = this._onSimulationStatusLogMessageReceived.bind(this);
  }

  componentDidMount() {
    this._stompClientStatusSubscription = this._watchStompClientStatusChanges();
  }

  private _watchStompClientStatusChanges() {
    return this._stompClientService.statusChanges()
      .subscribe({
        next: status => {
          switch (status) {
            case 'CONNECTING':
              if (this._stateStoreChangeSubscription)
                this._stateStoreChangeSubscription.unsubscribe();
              break;
            case 'CONNECTED':
              this._stateStoreChangeSubscription = this._subscribeToStateStoreChanges();
              break;
          }
        }
      });
  }

  private _subscribeToStateStoreChanges() {
    return this._stateStore.select('startSimulationResponse')
      .pipe(
        takeWhile(() => !this._stompClientStatusSubscription.closed),
        filter(simulationStartResponse => Boolean(simulationStartResponse)),
        map(simulationStartResponse => simulationStartResponse.simulationId),
        tap(simulationId => {
          this.setState({ isFetching: true });
          this._simulationQueue.updateIdOfActiveSimulation(simulationId);
        }),
        switchMap(this._newObservableForLogMessages)
      )
      .subscribe({
        next: this._onSimulationStatusLogMessageReceived
      });
  }

  private _newObservableToReadSimulationId() {
    return this._stompClientService.readOnceFrom(START_SIMULATION_TOPIC);
  }

  private _newObservableForLogMessages(simulationId: string) {
    return this._stompClientService.readFrom(`${SIMULATION_STATUS_LOG_TOPIC}.${simulationId}`)
      .pipe(filter(() => this._simulationControlService.currentStatus() === SimulationStatus.STARTED));
  }

  private _onSimulationStatusLogMessageReceived(logMessage: string) {
    this.setState({
      logMessages: [logMessage].concat(this.state.logMessages),
      isFetching: false
    });
  }

  componentWillUnmount() {
    this._stompClientStatusSubscription.unsubscribe();
  }

  render() {
    return <SimulationStatusLogger
      simulationRunning={this.state.isFetching}
      messages={this.state.logMessages}
      isFetching={this.state.isFetching} />;
  }

}