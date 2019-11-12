import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil, map, switchMap, take, tap } from 'rxjs/operators';

import {
  SimulationControlService,
  SimulationStatus,
  SimulationQueue,
  START_SIMULATION_TOPIC,
  SIMULATION_STATUS_LOG_TOPIC
} from '@shared/simulation';
import { SimulationControl } from './SimulationControl';
import { StateStore } from '@shared/state-store';
import { StompClientService, StompClientConnectionStatus } from '@shared/StompClientService';
import { ModelDictionaryComponent } from '@shared/topology';
import { PlotModel } from '@shared/plot-model/PlotModel';
import { SimulationStartedEventResponse } from './models/SimulationStartedEventResponse';
import { SimulationStatusLogMessage } from './models/SimulationStatusLogMessage';

interface Props {
}

interface State {
  simulationStatus: SimulationStatus;
  activeSimulationId: string;
  existingPlotModels: PlotModel[];
  modelDictionaryComponentsWithConsolidatedPhases: ModelDictionaryComponent[];
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
      simulationStatus: SimulationStatus.STOPPED,
      activeSimulationId: '',
      existingPlotModels: [],
      modelDictionaryComponentsWithConsolidatedPhases: []
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
    this._subscribeToPlotModelsStateChanges();
    this._subscribeToComponentsWithConsolidatedPhasesStateChanges();
  }

  private _stopSimulationWhenStompClientStatusChanges() {
    this._stompClientService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status !== StompClientConnectionStatus.CONNECTED)
      )
      .subscribe({
        next: this.stopSimulation
      });
  }

  stopSimulation() {
    this._stateStore.update({
      simulationId: ''
    });
    this._simulationControlService.stopSimulation();
  }

  private _subscribeToSimulationStatusChanges() {
    this._simulationControlService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        tap(status => this.setState({ simulationStatus: status })),
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
    this._stateStore.select('modelDictionaryComponentsWithConsolidatedPhases')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: components => this.setState({ modelDictionaryComponentsWithConsolidatedPhases: components })
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
        modelDictionaryComponentsWithConsolidatedPhases={this.state.modelDictionaryComponentsWithConsolidatedPhases}
        onStartSimulation={this.startSimulation}
        onStopSimulation={this.stopSimulation}
        onPauseSimulation={this.pauseSimulation}
        onResumeSimulation={this.resumeSimulation}
        onPlotModelCreationDone={this.updatePlotModels} />
    );
  }

  startSimulation() {
    this._subscribeToStartSimulationTopic();
    this._stopSimulationAfterReceivingCompleteProcessStatusMessage();
    this._simulationControlService.startSimulation(this._simulationQueue.getActiveSimulation().config);
  }

  private _subscribeToStartSimulationTopic() {
    this._stompClientService.readOnceFrom(START_SIMULATION_TOPIC)
      .pipe(map(JSON.parse as (payload: string) => SimulationStartedEventResponse))
      .subscribe({
        next: payload => {
          this._stateStore.update({
            simulationId: payload.simulationId,
            faultMRIDs: payload.events.map(event => event.faultMRID)
          });
        }
      });
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
        next: this.stopSimulation
      });
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
