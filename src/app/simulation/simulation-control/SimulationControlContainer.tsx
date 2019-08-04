import * as React from 'react';
import { Subject } from 'rxjs';
import { map, filter, takeUntil } from 'rxjs/operators';

import { SimulationControlService, SimulationStatus, SimulationQueue } from '@shared/simulation';
import { SimulationControl } from './SimulationControl';
import { StateStore } from '@shared/state-store';
import { StompClientService } from '@shared/StompClientService';

interface Props {
}

interface State {
  simulationStatus: SimulationStatus;
  activeSimulationId: string;
}

export class SimulationControlContainer extends React.Component<Props, State> {

  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);

    this.state = {
      simulationStatus: SimulationStatus.NEW,
      activeSimulationId: ''
    };

    this.startSimulation = this.startSimulation.bind(this);
    this.stopSimulation = this.stopSimulation.bind(this);
    this.pauseSimulation = this.pauseSimulation.bind(this);
    this.resumeSimulation = this.resumeSimulation.bind(this);
  }

  componentDidMount() {
    this._subscribeToSimulationStatusChanges();
    this._stopSimulationWhenStompClientStatusChanges();
  }

  private _subscribeToSimulationStatusChanges() {
    this._simulationControlService.statusChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: status => {
          this.setState({
            simulationStatus: status
          });
          if (status === SimulationStatus.STARTED)
            this._readSimulationIdFromStore();
        }
      });
  }

  private _readSimulationIdFromStore() {
    this._stateStore.select('startSimulationResponse')
      .pipe(
        takeUntil(this._unsubscriber),
        filter(simulationStartResponse => Boolean(simulationStartResponse)),
        map(simulationStartResponse => simulationStartResponse.simulationId)
      )
      .subscribe({
        next: simulationId => this.setState({ activeSimulationId: simulationId })
      });
  }

  private _stopSimulationWhenStompClientStatusChanges() {
    this._stompClientService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status !== 'CONNECTED')
      )
      .subscribe({
        next: this.stopSimulation
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      <SimulationControl
        timestamp=''
        simulationId={this.state.activeSimulationId}
        simulationStatus={this.state.simulationStatus}
        onStartSimulation={this.startSimulation}
        onStopSimulation={this.stopSimulation}
        onPauseSimulation={this.pauseSimulation}
        onResumeSimulation={this.resumeSimulation} />
    );
  }

  startSimulation() {
    this._simulationControlService.startSimulation(this._simulationQueue.getActiveSimulation().config);
  }

  stopSimulation() {
    this._simulationControlService.stopSimulation();
  }

  pauseSimulation() {
    this._simulationControlService.pauseSimulation();
  }

  resumeSimulation() {
    this._simulationControlService.resumeSimulation();
  }

}
