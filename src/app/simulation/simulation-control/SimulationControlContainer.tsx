import * as React from 'react';
import { Subject } from 'rxjs';
import { map, filter, takeUntil } from 'rxjs/operators';

import { SimulationControlService, SimulationStatus, SimulationQueue } from '@shared/simulation';
import { SimulationControl } from './SimulationControl';
import { StateStore } from '@shared/state-store';
import { StompClientService } from '@shared/StompClientService';
import { ModelDictionary } from '@shared/topology';
import { PlotModel } from '@shared/plot-model';

interface Props {
}

interface State {
  simulationStatus: SimulationStatus;
  activeSimulationId: string;
  modelDictionary: ModelDictionary;
  existingPlotModels: PlotModel[];
}

export class SimulationControlContainer extends React.Component<Props, State> {

  activeSimulationId: string;

  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);

    this.state = {
      simulationStatus: SimulationStatus.STOPPED,
      activeSimulationId: '',
      modelDictionary: null,
      existingPlotModels: []
    };

    this.startSimulation = this.startSimulation.bind(this);
    this.stopSimulation = this.stopSimulation.bind(this);
    this.pauseSimulation = this.pauseSimulation.bind(this);
    this.resumeSimulation = this.resumeSimulation.bind(this);
    this.updatePlotModels = this.updatePlotModels.bind(this);
  }

  componentDidMount() {
    this._stopSimulationWhenStompClientStatusChanges();
    this._subscribeToSimulationStatusChanges();
    this._watchForUpdatedModelDictionary();
    this._subscribeToPlotModelsStateChanges();
  }

  private _watchForUpdatedModelDictionary() {
    this._stateStore.select('modelDictionary')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: modelDictionary => this.setState({ modelDictionary })
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

  private _subscribeToPlotModelsStateChanges() {
    this._stateStore.select('plotModels')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: plotModels => this.setState({ existingPlotModels: plotModels })
      });
  }

  componentWillUnmount() {
    this._unsubscriber.complete();
  }

  render() {
    return (
      <SimulationControl
        timestamp=''
        simulationId={this.state.activeSimulationId}
        simulationStatus={this.state.simulationStatus}
        modelDictionary={this.state.modelDictionary}
        existingPlotModels={this.state.existingPlotModels}
        onStartSimulation={this.startSimulation}
        onStopSimulation={this.stopSimulation}
        onPauseSimulation={this.pauseSimulation}
        onResumeSimulation={this.resumeSimulation}
        onPlotModelCreationDone={this.updatePlotModels} />
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

  updatePlotModels(plotModels: PlotModel[]) {
    this._stateStore.update({
      plotModels
    });
  }

}
