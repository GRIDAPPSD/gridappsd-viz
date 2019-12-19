import * as React from 'react';
import { Subscription } from 'rxjs';
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
        tap(() => {
          this.setState({
            isFetching: false
          });
        }),
        filter(status => status === StompClientConnectionStatus.CONNECTED),
        switchMap(() => this._stateStore.select('simulationId')),
        filter(simulationId => simulationId !== ''),
        switchMap(this._newObservableForLogMessages)
      )
      .subscribe({
        next: this._onSimulationStatusLogMessageReceived
      });
  }

  private _newObservableForLogMessages(simulationId: string) {
    this.setState({
      logMessages: [],
      isFetching: true
    });
    return this._stompClientService.readFrom(`${SIMULATION_STATUS_LOG_TOPIC}.${simulationId}`)
      .pipe(
        takeWhile(this._simulationControlService.isUserInActiveSimulation),
        takeUntil(
          this._simulationControlService.statusChanges()
            .pipe(filter(status => status === SimulationStatus.STOPPED))
        ),
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

  componentWillUnmount() {
    this._statusLogMessageStreamSubscription.unsubscribe();
  }

  render() {
    return (
      <SimulationStatusLogger
        messages={this.state.logMessages}
        isFetching={this.state.isFetching} />
    );
  }

}
