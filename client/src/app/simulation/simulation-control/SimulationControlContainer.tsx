import { Component } from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil, switchMap, tap } from 'rxjs/operators';

import { SimulationManagementService } from '@client:common/simulation';
import { StateStore } from '@client:common/state-store';
import { ModelDictionaryComponent } from '@client:common/topology';
import { PlotModel } from '@client:common/plot-model/PlotModel';
import { SimulationStatus } from '@project:common/SimulationStatus';

import { SimulationControl } from './SimulationControl';

interface Props {
  exportSimulationConfiguration: () => void;
  fieldModelMrid: string;
}

interface State {
  simulationStatus: SimulationStatus;
  activeSimulationId: string;
  existingPlotModels: PlotModel[];
  modelDictionaryComponents: ModelDictionaryComponent[];
}

export class SimulationControlContainer extends Component<Props, State> {

  readonly simulationManagementService = SimulationManagementService.getInstance();

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
    this._stopSimulationWhenRedirect();
    this._subscribeToSimulationStatusChanges();
    this._subscribeToPlotModelsStateChanges();
    this._subscribeToComponentsWithConsolidatedPhasesStateChanges();
    this._subscribeToSimulationIdChanges();
  }

  private _stopSimulationWhenRedirect() {
    if (this.props.fieldModelMrid && this.props.fieldModelMrid !== '') {
      this.simulationManagementService.stopSimulation();
      this.setState({
        simulationStatus: SimulationStatus.STOPPED
      });
    }
  }

  private _subscribeToSimulationStatusChanges() {
    this.simulationManagementService.simulationStatusChanges()
      .pipe(
        tap(status => {
          if (this.simulationManagementService.isUserInActiveSimulation()) {
            this.setState({
              simulationStatus: status
            });
          }
        }),
        filter(status => status === SimulationStatus.STARTING),
        switchMap(() => this._stateStore.select('simulationId')),
        filter(simulationId => simulationId !== ''),
        takeUntil(this._unsubscriber)
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
        fieldModelMrid={this.props.fieldModelMrid}
        simulationId={this.state.activeSimulationId}
        simulationStatus={this.state.simulationStatus}
        existingPlotModels={this.state.existingPlotModels}
        onStartSimulation={this.simulationManagementService.startSimulation}
        onStartFieldModelSimulation={this.simulationManagementService.startFieldModelSimulation}
        onExportSimulationConfiguration={this.props.exportSimulationConfiguration}
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
