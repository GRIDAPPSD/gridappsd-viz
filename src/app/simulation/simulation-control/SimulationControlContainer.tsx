import * as React from 'react';
import { Subscription } from 'rxjs';
import { map, filter, takeWhile } from 'rxjs/operators';

import { SimulationControlService, SimulationStatus, SimulationQueue, START_SIMULATION_TOPIC } from '@shared/simulation';
import { SimulationControl } from './SimulationControl';
import { StateStore } from '@shared/state-store';

interface Props {
}

interface State {
  simulationStatus: SimulationStatus;
  activeSimulationId: string;
}

export class SimulationControlContainer extends React.Component<Props, State> {

  activeSimulationId: string;

  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _simulationStatusChangeSubscription: Subscription;

  constructor(props: any) {
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
    this._simulationStatusChangeSubscription = this._subscribeToSimulationStatusChanges();
  }

  private _subscribeToSimulationStatusChanges() {
    return this._simulationControlService.statusChanges()
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
        takeWhile(() => !this._simulationStatusChangeSubscription.closed),
        filter(simulationStartResponse => Boolean(simulationStartResponse)),
        map(simulationStartResponse => simulationStartResponse.simulationId)
      )
      .subscribe({
        next: simulationId => this.setState({ activeSimulationId: simulationId })
      });
  }

  componentWillUnmount() {
    this._simulationStatusChangeSubscription.unsubscribe();
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