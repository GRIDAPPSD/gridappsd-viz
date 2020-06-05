import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil, map, switchMap, take, tap } from 'rxjs/operators';

import { SimulationManagementService } from '@shared/simulation';
import { SimulationStatus } from '@commons/SimulationStatus';
import { SimulationControl } from './SimulationControl';
import { StateStore } from '@shared/state-store';
import { StompClientService, StompClientConnectionStatus } from '@shared/StompClientService';
import { ModelDictionaryComponent } from '@shared/topology';
import { PlotModel } from '@shared/plot-model/PlotModel';

interface Props {
}

interface State {
  simulationStatus: SimulationStatus;
  activeSimulationId: string;
  existingPlotModels: PlotModel[];
  modelDictionaryComponents: ModelDictionaryComponent[];
}

export class SimulationControlContainer extends React.Component<Props, State> {

  readonly simulationManagementService = SimulationManagementService.getInstance();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  constructor(props: Props) {
    super(props);

    this.state = {
      simulationStatus: this.simulationManagementService.currentSimulationStatus(),
      activeSimulationId: '',
      existingPlotModels: [],
      modelDictionaryComponents: []
    };

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
        next: this.simulationManagementService.stopSimulation
      });
  }

  private _subscribeToSimulationStatusChanges() {
    this.simulationManagementService.simulationStatusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        tap(status => {
          if (this.simulationManagementService.isUserInActiveSimulation()) {
            this.setState({
              simulationStatus: status
            });
          }
        }),
        filter(status => status === SimulationStatus.STARTING),
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
    this._stateStore.select('modelDictionaryComponents')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: components => this.setState({ modelDictionaryComponents: components })
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
        onStartSimulation={this.simulationManagementService.startSimulation}
        modelDictionaryComponents={this.state.modelDictionaryComponents}
        onStopSimulation={this.simulationManagementService.stopSimulation}
        onPauseSimulation={this.simulationManagementService.pauseSimulation}
        onResumeSimulation={this.simulationManagementService.resumeSimulation}
        onResumeThenPauseSimulation={this.simulationManagementService.resumeThenPauseSimulationAfter}
        onPlotModelCreationDone={this.updatePlotModels} />
    );
  }

  updatePlotModels(plotModels: PlotModel[]) {
    this._stateStore.update({
      plotModels
    });
  }

}
