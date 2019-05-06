import * as React from 'react';
import { Subscription } from 'rxjs';

import { SimulationConfiguration, SimulationControlService, SimulationStatus, SimulationQueue } from '@shared/simulation';
import { SimulationControl } from './SimulationControl';

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
  private _simulationStatusChangeSubscription: Subscription;
  private _activeSimulationIdChangeSubscription: Subscription;

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
    this._activeSimulationIdChangeSubscription = this._subscribeToActiveSimulationIdChanges();
  }

  private _subscribeToSimulationStatusChanges() {
    return this._simulationControlService.statusChanged()
      .subscribe({
        next: status => this.setState({ simulationStatus: status })
      });
  }

  private _subscribeToActiveSimulationIdChanges() {
    return this._simulationQueue.activeSimulationIdChanged()
      .subscribe({
        next: id => this.setState({ activeSimulationId: id })
      });
  }

  componentWillUnmount() {
    this._simulationStatusChangeSubscription.unsubscribe();
    this._activeSimulationIdChangeSubscription.unsubscribe();
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