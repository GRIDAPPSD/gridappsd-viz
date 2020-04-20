import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, switchMap, tap, takeWhile, finalize, takeUntil } from 'rxjs/operators';

import { SimulationStatusLogger } from './SimulationStatusLogger';
import { SIMULATION_STATUS_LOG_TOPIC, SimulationControlService } from '@shared/simulation';
import { StompClientService, StompClientConnectionStatus } from '@shared/StompClientService';
import { StateStore } from '@shared/state-store';
import { generateUniqueId } from '@shared/misc';
import { LogMessage } from './models/LogMessage';
import { SimulationStatus } from '@commons/SimulationStatus';

interface Props {

}

interface State {
  logMessages: LogMessage[];
  isFetching: boolean;
}

export class SimulationStatusLogContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

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
    this._subscribeToSimulationStatusLogMessageStream();
    this._clearAllLogMessagesWhenSimulationStarts();
  }

  private _subscribeToSimulationStatusLogMessageStream() {
    this._stompClientService.statusChanges()
      .pipe(
        tap(() => {
          this.setState({
            isFetching: false
          });
        }),
        takeUntil(this._unsubscriber),
        filter(status => status === StompClientConnectionStatus.CONNECTED),
        switchMap(() => this._stateStore.select('simulationId')),
        takeUntil(this._unsubscriber),
        filter(simulationId => simulationId !== ''),
        switchMap(this._newObservableForLogMessages)
      )
      .subscribe({
        next: this._onSimulationStatusLogMessageReceived
      });
  }

  private _newObservableForLogMessages(simulationId: string) {
    this.setState({
      isFetching: true
    });
    return this._stompClientService.readFrom(`${SIMULATION_STATUS_LOG_TOPIC}.${simulationId}`)
      .pipe(
        takeWhile(this._simulationControlService.isUserInActiveSimulation),
        takeUntil(
          this._simulationControlService.statusChanges()
            .pipe(filter(status => status === SimulationStatus.STOPPED))
        ),
        takeUntil(this._unsubscriber),
        finalize(() => {
          this.setState({
            isFetching: false
          });
        })
      );
  }

  private _onSimulationStatusLogMessageReceived(logMessageContent: string) {
    this.setState({
      logMessages: [{ id: generateUniqueId(), content: logMessageContent }].concat(this.state.logMessages),
      isFetching: false
    });
  }

  private _clearAllLogMessagesWhenSimulationStarts() {
    this._simulationControlService.statusChanges()
      .pipe(
        filter(status => status === SimulationStatus.STARTING && this._simulationControlService.didUserStartActiveSimulation()),
        takeUntil(this._unsubscriber)
      )
      .subscribe({
        next: () => {
          this.setState({
            logMessages: [],
            isFetching: true
          });
        }
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      <SimulationStatusLogger
        messages={this.state.logMessages}
        isFetching={this.state.isFetching} />
    );
  }

}
