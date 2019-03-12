import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil, filter, switchMap, tap } from 'rxjs/operators';

import { SimulationStatusLog } from './SimulationStatusLog';
import {
  SimulationQueue, START_SIMULATION_TOPIC, SIMULATION_STATUS_LOG_TOPIC, SimulationControlService, SimulationStatus
} from '@shared/simulation';
import { StompClientService } from '@shared/StompClientService';

interface Props {

}

interface State {
  logMessages: Array<string>;
  isFetching: boolean;
}


export class SimulationStatusLogContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _componentWillUnmountNotifier = new Subject<void>();

  constructor(props: Props) {
    super(props);
    this.state = {
      logMessages: [],
      isFetching: false
    };
  }

  componentDidMount() {
    this._respondToSimulationStatusChanges();
  }

  private _respondToSimulationStatusChanges() {
    this._simulationControlService.statusChanged()
      .pipe(
        takeUntil(this._componentWillUnmountNotifier),
        tap(status => {
          if (status === SimulationStatus.STOPPED)
            this._closeAllSubscriptions();
        }),
        filter(status => status === SimulationStatus.STARTED),
        switchMap(() => this._newObservableToReadSimulationId()),
        tap(simulationId => {
          this.setState({ isFetching: true });
          this._simulationQueue.updateIdOfActiveSimulation(simulationId);
        }),
        switchMap(simulationId => this._newObservableForLogMessages(simulationId)),
        takeUntil(this._componentWillUnmountNotifier)
      )
      .subscribe({
        next: logMessage => this._onSimulationStatusLogMessageReceived(logMessage)
      });
  }

  private _closeAllSubscriptions() {
    if (!this._componentWillUnmountNotifier.closed) {
      this._componentWillUnmountNotifier.next();
      this._componentWillUnmountNotifier.complete();
    }
  }

  private _newObservableToReadSimulationId() {
    return this._stompClientService.readOnceFrom(START_SIMULATION_TOPIC);
  }

  private _newObservableForLogMessages(simulationId: string) {
    return this._stompClientService.readFrom(`${SIMULATION_STATUS_LOG_TOPIC}.${simulationId}`);
  }

  private _onSimulationStatusLogMessageReceived(logMessage: string) {
    this.setState({
      logMessages: this.state.logMessages.concat(logMessage),
      isFetching: false
    });
  }

  componentWillUnmount() {
    this._closeAllSubscriptions();
  }

  render() {
    return <SimulationStatusLog
      simulationRunning={this.state.isFetching}
      messages={this.state.logMessages}
      isFetching={this.state.isFetching} />;
  }

}