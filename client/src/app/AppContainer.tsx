import { Component } from 'react';
import { zip } from 'rxjs';
import { take, filter } from 'rxjs/operators';

import { Application } from '@client:common/Application';
import { StateStore, ApplicationState } from '@client:common/state-store';
import { StompClientService, StompClientConnectionStatus } from '@client:common/StompClientService';
import { FeederModel, TopologyModel } from '@client:common/topology';
import {
  ModelDictionary,
  MeasurementType,
  ModelDictionaryMeasurement,
  ModelDictionaryComponent
} from '@client:common/topology/model-dictionary';
import {
  SimulationConfiguration,
  Simulation,
  SimulationQueue,
  SimulationManagementService
} from '@client:common/simulation';
import { ConductingEquipmentType } from '@client:common/topology/model-dictionary';
import { AuthenticatorService } from '@client:common/authenticator';
import { Notification } from '@client:common/overlay/notification';

import { GetModelDictionaryRequest, GetModelDictionaryResponsePayload } from './models/message-requests/GetModelDictionaryRequest';
import {
  GetAvailableApplicationsAndServicesRequest, GetAvailableApplicationsRequestPayload
} from './models/message-requests/GetAvailableApplicationsAndServicesRequest';
import { DEFAULT_APPLICATION_STATE } from './models/default-application-state';
import { GetAllFeederModelsRequest, GetFeederModelsResponsePayload } from './models/message-requests/GetAllFeederModelsRequest';
import { App } from './App';

import './App.light.scss';
import './App.dark.scss';

interface Props {
}

interface State {
  feederModel: FeederModel;
  availableApplications: Application[];
  stompClientConnectionStatus: StompClientConnectionStatus;
}

export class AppContainer extends Component<Props, State> {

  readonly componentMRIDs = new Map<string, string | string[]>();
  readonly componentPhases = new Map<string, string[]>();
  readonly authenticatorService = AuthenticatorService.getInstance();
  readonly simulationManagementService = SimulationManagementService.getInstance();

  private readonly _stateStore = StateStore.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _availableModelDictionaries = new Map<string, ModelDictionary>();

  constructor(props: Props) {
    super(props);

    this.state = {
      feederModel: null,
      availableApplications: null,
      stompClientConnectionStatus: StompClientConnectionStatus.UNINITIALIZED
    };

    this._stateStore.initialize(DEFAULT_APPLICATION_STATE);

    this.retrieveModelDictionary = this.retrieveModelDictionary.bind(this);
    this.onSimulationConfigFormSubmitted = this.onSimulationConfigFormSubmitted.bind(this);
  }

  componentDidMount() {
    this._stompClientService.statusChanges()
      .pipe(
        filter(status => status === StompClientConnectionStatus.CONNECTED),
        take(1)
      )
      .subscribe({
        next: status => {
          this.setState({
            stompClientConnectionStatus: status
          });
          this._fetchAvailableApplicationsAndServices();
          this._fetchFeederModels();
        }
      });
    zip(
      this.simulationManagementService.selectSimulationSnapshotState('stateStore'),
      this.simulationManagementService.selectSimulationSnapshotState('topologyModel')
    )
      .subscribe({
        next: (tuple: [ApplicationState, TopologyModel]) => {
          const modelMRID = tuple[1].feeders[0].mRID;
          const modelDictionary = tuple[0].modelDictionary;
          this._availableModelDictionaries.set(modelMRID, modelDictionary);
          this._processModelDictionary(modelDictionary);
          this._stateStore.update(tuple[0]);
        }
      });
  }

  private _fetchAvailableApplicationsAndServices() {
    const request = new GetAvailableApplicationsAndServicesRequest();
    this._subscribeToAvailableApplicationsTopic(request.replyTo);
    this._stompClientService.send({
      destination: request.url,
      replyTo: request.replyTo,
      body: JSON.stringify(request.requestBody)
    });
  }

  private _subscribeToAvailableApplicationsTopic(destination: string) {
    this._stompClientService.readOnceFrom<GetAvailableApplicationsRequestPayload>(destination)
      .subscribe({
        next: payload => {
          this._stateStore.update({
            applications: payload.applications,
            services: payload.services
          });
          this.setState({
            availableApplications: payload.applications
          });
        }
      });
  }

  private _fetchFeederModels() {
    const getAllFeederModelsRequest = new GetAllFeederModelsRequest();
    this._subscribeToFeederModelsTopic(getAllFeederModelsRequest.replyTo);
    this._stompClientService.send({
      destination: getAllFeederModelsRequest.url,
      replyTo: getAllFeederModelsRequest.replyTo,
      body: getAllFeederModelsRequest.requestBody
    });
  }

  private _subscribeToFeederModelsTopic(destination: string) {
    this._stompClientService.readOnceFrom<GetFeederModelsResponsePayload>(destination)
      .subscribe({
        next: payload => {
          const feederModel = {} as FeederModel;

          for (const binding of payload.results.bindings) {
            const regionId = binding.regionID.value;
            if (!(regionId in feederModel)) {
              feederModel[regionId] = {
                id: regionId,
                name: binding.regionName.value,
                lines: [],
                subregions: []
              };
            }

            const lines = feederModel[regionId].lines;
            const subregions = feederModel[regionId].subregions;

            if (lines.find(line => line.name === binding.name.value) === undefined) {
              lines.push({
                name: binding.name.value,
                id: binding.mRID.value,
                subregionId: binding.subregionID.value
              });
            }
            if (subregions.find(subregion => subregion.name === binding.subregionName.value) === undefined) {
              subregions.push({
                name: binding.subregionName.value,
                id: binding.subregionID.value
              });
            }
          }
          this.setState({
            feederModel
          });
        },
        error: reason => {
          Notification.open(reason);
        }
      });
  }

  render() {
    return (
      <App
        stompClientConnectionStatus={this.state.stompClientConnectionStatus}
        feederModel={this.state.feederModel}
        availableApplications={this.state.availableApplications}
        componentMRIDs={this.componentMRIDs}
        componentPhases={this.componentPhases}
        onLogout={this.authenticatorService.logout}
        onMRIDChanged={this.retrieveModelDictionary}
        onSimulationConfigFormSubmitted={this.onSimulationConfigFormSubmitted}
        onJoinActiveSimulation={this.simulationManagementService.requestToJoinActiveSimulation} />
    );
  }

  retrieveModelDictionary(mRID: string) {
    this._stateStore.update({
      modelDictionaryComponents: [],
      plotModels: []
    });
    if (!this._availableModelDictionaries.has(mRID)) {
      // Clear out the currently active model dictionary
      this._stateStore.update({
        modelDictionary: null
      });
      this._fetchModelDictionary(mRID);
    } else {
      this._processModelDictionary(this._availableModelDictionaries.get(mRID));
    }
  }

  private _fetchModelDictionary(mrid: string) {
    const getModelDictionaryRequest = new GetModelDictionaryRequest();
    // eslint-disable-next-line camelcase
    getModelDictionaryRequest.requestBody.parameters.model_id = mrid;
    this._subscribeToModelDictionaryTopic(getModelDictionaryRequest);
    this._stompClientService.send({
      destination: getModelDictionaryRequest.url,
      replyTo: getModelDictionaryRequest.replyTo,
      body: JSON.stringify(getModelDictionaryRequest.requestBody)
    });
  }

  private _subscribeToModelDictionaryTopic(getModelDictionaryRequest: GetModelDictionaryRequest) {
    this._stompClientService.readOnceFrom<GetModelDictionaryResponsePayload>(getModelDictionaryRequest.replyTo)
      .subscribe({
        next: payload => {
          const modelDictionary = payload.feeders[0];
          this._availableModelDictionaries.set(
            getModelDictionaryRequest.requestBody.parameters.model_id,
            modelDictionary
          );
          this._processModelDictionary(modelDictionary);
        }
      });
  }

  private _processModelDictionary(modelDictionary: ModelDictionary) {
    const modelDictionaryMeasurementMap = new Map<string, ModelDictionaryMeasurement>();
    for (const measurement of modelDictionary.measurements) {
      modelDictionaryMeasurementMap.set(measurement.mRID, measurement);
    }
    this._collectMRIDsAndPhasesForComponents(modelDictionary);
    this.simulationManagementService.updateModelDictionaryMeasurementMap(modelDictionaryMeasurementMap);
    this._findAllPhasesForEachComponentThenGroupThem(modelDictionary);
    this._stateStore.update({
      modelDictionary
    });
  }

  private _collectMRIDsAndPhasesForComponents(modelDictionary: ModelDictionary) {
    this.componentMRIDs.clear();
    this.componentPhases.clear();
    for (const swjtch of modelDictionary.switches) {
      this.componentMRIDs.set(swjtch.name, swjtch.mRID);
    }
    for (const capacitor of modelDictionary.capacitors) {
      this.componentMRIDs.set(capacitor.name, capacitor.mRID);
    }
    for (const regulator of modelDictionary.regulators) {
      this.componentMRIDs.set(regulator.bankName, regulator.mRID);
      // Only interested in regulators' phases for now, need phases for regulator menus
      this.componentPhases.set(regulator.bankName, (regulator.bankPhases || '').split(''));
    }
  }

  private _findAllPhasesForEachComponentThenGroupThem(modelDictionary: ModelDictionary) {
    const modelDictionaryComponentMap = new Map<string, ModelDictionaryComponent>();
    const measurementMRIDMap = new Map<string, Array<{ phase: string; mrid: string }>>();
    for (const measurement of modelDictionary.measurements) {
      const name = measurement.measurementType === MeasurementType.VOLTAGE
        ? measurement.ConnectivityNode
        : measurement.ConductingEquipment_name;
      const phases = measurement.phases;
      const id = measurement.name;
      let modelDictionaryComponent = modelDictionaryComponentMap.get(id);
      if (!modelDictionaryComponent) {
        modelDictionaryComponent = {
          id,
          name,
          conductingEquipmentName: measurement.ConductingEquipment_name,
          conductingEquipmentType: measurement.ConductingEquipment_type as ConductingEquipmentType,
          displayName: '',
          phases: [],
          conductingEquipmentMRIDs: [],
          type: measurement.measurementType as MeasurementType,
          measurementMRIDs: []
        };
        measurementMRIDMap.set(id, []);
        modelDictionaryComponentMap.set(id, modelDictionaryComponent);
      }
      if (!modelDictionaryComponent.phases.includes(phases)) {
        const measurementMRIDAndPhaseArray = measurementMRIDMap.get(id);
        measurementMRIDAndPhaseArray.push({ phase: phases, mrid: measurement.mRID });
        modelDictionaryComponent.measurementMRIDs = measurementMRIDAndPhaseArray.sort(
          (a, b) => a.phase.localeCompare(b.phase)
        ).map(e => e.mrid);
        modelDictionaryComponent.phases.push(phases);
        modelDictionaryComponent.phases.sort((a, b) => a.localeCompare(b));
        modelDictionaryComponent.displayName = `${name} (${modelDictionaryComponent.phases.join(', ')})`;
        modelDictionaryComponent.conductingEquipmentMRIDs.push(measurement.ConductingEquipment_mRID);
      }
    }
    this._stateStore.update({
      modelDictionaryComponents: [...modelDictionaryComponentMap.values()]
    });
  }

  onSimulationConfigFormSubmitted(config: SimulationConfiguration) {
    this._simulationQueue.push(new Simulation(config));
    this._stateStore.update({
      simulationId: ''
    });
  }

}
