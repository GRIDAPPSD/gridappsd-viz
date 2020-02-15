import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil, map, switchMap, take, tap } from 'rxjs/operators';

import {
  SimulationControlService,
  SIMULATION_STATUS_LOG_TOPIC
} from '@shared/simulation';
import { SimulationStatus } from '@commons/SimulationStatus';
import { SimulationControl } from './SimulationControl';
import { StateStore } from '@shared/state-store';
import { StompClientService, StompClientConnectionStatus } from '@shared/StompClientService';
import { ModelDictionaryComponent } from '@shared/topology';
import { PlotModel } from '@shared/plot-model/PlotModel';
import { SimulationStatusLogMessage } from './models/SimulationStatusLogMessage';

interface Props {
}

interface State {
  simulationStatus: SimulationStatus;
  activeSimulationId: string;
  existingPlotModels: PlotModel[];
  modelDictionaryComponentsWithGroupedPhases: ModelDictionaryComponent[];
}

export class SimulationControlContainer extends React.Component<Props, State> {

  readonly simulationControlService = SimulationControlService.getInstance();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);

    this.state = {
      simulationStatus: this.simulationControlService.currentStatus(),
      activeSimulationId: '',
      existingPlotModels: [],
      modelDictionaryComponentsWithGroupedPhases: []
    };

    this.startSimulation = this.startSimulation.bind(this);
    this.updatePlotModels = this.updatePlotModels.bind(this);
  }

  componentDidMount() {
    this._stopSimulationWhenStompClientStatusChanges();
    this._subscribeToSimulationStatusChanges();
    this._subscribeToPlotModelsStateChanges();
    this._subscribeToComponentsWithConsolidatedPhasesStateChanges();
    this._subscribeToSimulationIdChanges();
  }

  private _stopSimulationWhenStompClientStatusChanges() {
    this._stompClientService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status !== StompClientConnectionStatus.CONNECTED)
      )
      .subscribe({
        next: this.simulationControlService.stopSimulation
      });
  }

  private _subscribeToSimulationStatusChanges() {
    this.simulationControlService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        tap(status => {
          if (this.simulationControlService.isUserInActiveSimulation()) {
            this.setState({
              simulationStatus: status
            });
          }
        }),
        filter(status => status === SimulationStatus.STARTED),
        switchMap(() => this._stateStore.select('simulationId')),
        takeUntil(this._unsubscriber),
        filter(simulationId => simulationId !== '')
      )
      .subscribe({
        next: simulationId => {
          this.setState({
            activeSimulationId: simulationId
          });
        }
      });
  }

  private _subscribeToPlotModelsStateChanges() {
    this._stateStore.select('plotModels')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: plotModels => this.setState({ existingPlotModels: plotModels })
      });
  }

  private _subscribeToComponentsWithConsolidatedPhasesStateChanges() {
    this._stateStore.select('modelDictionaryComponentsWithGroupedPhases')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: components => this.setState({ modelDictionaryComponentsWithGroupedPhases: components })
      });
  }

  private _subscribeToSimulationIdChanges() {
    this._stateStore.select('simulationId')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: id => this.setState({ activeSimulationId: id })
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      <SimulationControl
        simulationId={this.state.activeSimulationId}
        simulationStatus={this.state.simulationStatus}
        existingPlotModels={this.state.existingPlotModels}
        modelDictionaryComponentsWithConsolidatedPhases={this.state.modelDictionaryComponentsWithGroupedPhases}
        onStartSimulation={this.startSimulation}
        onStopSimulation={this.simulationControlService.stopSimulation}
        onPauseSimulation={this.simulationControlService.pauseSimulation}
        onResumeSimulation={this.simulationControlService.resumeSimulation}
        onPlotModelCreationDone={this.updatePlotModels} />
    );
  }

  startSimulation() {
    this._stopSimulationAfterReceivingCompleteProcessStatusMessage();
    this.simulationControlService.startSimulation();
  }

  private _stopSimulationAfterReceivingCompleteProcessStatusMessage() {
    this._stateStore.select('simulationId')
      .pipe(
        filter(simulationId => simulationId !== ''),
        switchMap(id => this._stompClientService.readFrom(`${SIMULATION_STATUS_LOG_TOPIC}.${id}`)),
        map((JSON.parse as (payload: string) => SimulationStatusLogMessage)),
        filter(message => message.processStatus === 'COMPLETE'),
        take(1)
      )
      .subscribe({
        next: this.simulationControlService.stopSimulation
      });
  }

  updatePlotModels(plotModels: PlotModel[]) {
    this._stateStore.update({
      plotModels
    });
  }

}
