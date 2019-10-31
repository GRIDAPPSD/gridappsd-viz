import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { map, take, filter } from 'rxjs/operators';

import { Application } from '@shared/Application';
import { AvailableApplicationsAndServices } from './available-applications-and-services';
import { DataBrowser } from './data-browser';
import { FeederModel } from '@shared/topology';
import { GetAllFeederModelsRequest } from './models/message-requests/GetAllFeederModelsRequest';
import { SimulationLabelsContainer } from './simulation/simulation-labels';
import { MeasurementChartContainer } from './simulation/measurement-chart';
import {
  ModelDictionaryMeasurement, ModelDictionary,
  ModelDictionaryComponentType,
  ModelDictionaryComponent
} from '@shared/topology/model-dictionary';
import { Navigation } from './navigation';
import { OverlayService } from '@shared/overlay';
import { SimulationConfiguration } from '@shared/simulation';
import { SimulationConfigurationEditor } from './simulation/simulation-configuration';
import { SimulationControlContainer } from './simulation/simulation-control';
import { SimulationQueue, SimulationOutputService, DEFAULT_SIMULATION_CONFIGURATION } from '@shared/simulation';
import { SimulationStatusLogContainer } from './simulation/simulation-status-logger';
import { StompClientContainer } from './stomp-client';
import { StompClientService } from '@shared/StompClientService';
import { TopologyRendererContainer } from './simulation/topology-renderer';
import { WebsocketStatusWatcher } from './websocket-status-watcher';
import { GetModelDictionaryRequest } from './models/message-requests/GetModelDictionaryRequest';
import {
  GetAvailableApplicationsAndServicesRequest, GetAvailableApplicationsRequestPayload
} from './models/message-requests/GetAvailableApplicationsAndServicesRequest';
import { StateStore } from '@shared/state-store';
import { DEFAULT_APPLICATION_STATE } from './models/default-application-state';
import { TabGroup, Tab } from '@shared/tabs';
import { EventSummary } from './simulation/event-summary/EventSummary';
import { AvailableApplicationList } from './simulation/applications/AvailableApplicationList';
import { VoltageViolationContainer } from './simulation/voltage-violation/VoltageViolationContainer';
import { AlarmsContainer } from './simulation/alarms';
import { Settings } from './settings';

import './App.light.scss';
import './App.dark.scss';

interface Props {
}

interface State {
  feederModel: FeederModel;
  availableApplications: Application[];
}

export class App extends React.Component<Props, State> {

  readonly componentMRIDs = new Map<string, string & string[]>();
  readonly componentPhases = new Map<string, string[]>();

  shouldRedirect = false;
  tabGroup: TabGroup;

  private _stateStore = StateStore.getInstance();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _overlayService = OverlayService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _availableModelDictionaries = new Map<string, ModelDictionary>();

  constructor(props: any) {
    super(props);

    this.state = {
      feederModel: null,
      availableApplications: null
    };

    this._stateStore.initialize(DEFAULT_APPLICATION_STATE);
  }

  componentDidCatch() {
    this.shouldRedirect = true;
  }

  componentDidMount() {
    this._stompClientService.statusChanges()
      .pipe(
        filter(status => status === 'CONNECTED'),
        take(1)
      )
      .subscribe({
        next: () => {
          this._fetchAvailableApplicationsAndServices();
          this._fetchFeederModels();
        }
      });
  }

  private _fetchAvailableApplicationsAndServices() {
    const request = new GetAvailableApplicationsAndServicesRequest();
    this._subscribeToAvailableApplicationsTopic(request.replyTo);
    this._stompClientService.send(
      request.url,
      { 'reply-to': request.replyTo },
      JSON.stringify(request.requestBody)
    );
  }

  private _subscribeToAvailableApplicationsTopic(destination: string) {
    this._stompClientService.readOnceFrom(destination)
      .pipe(map(body => JSON.parse(body) as GetAvailableApplicationsRequestPayload))
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
    this._stompClientService.send(
      getAllFeederModelsRequest.url,
      { 'reply-to': getAllFeederModelsRequest.replyTo },
      getAllFeederModelsRequest.requestBody
    );
  }

  private _subscribeToFeederModelsTopic(destination: string) {
    this._stompClientService.readOnceFrom(destination)
      .pipe(map(body => JSON.parse(body)))
      .subscribe({
        next: payload => {
          const feederModel = {} as FeederModel;
          if (typeof payload.data === 'string')
            payload.data = JSON.parse(payload.data);
          /*
              payload.data.results.bindings is an array of
                {
                    "name": {
                        "type": "literal",
                        "value": string
                    },
                    "mRID": {
                        "type": "literal",
                        "value": string
                    },
                    "substationName": {
                        "type": "literal",
                        "value": string
                    },
                    "substationID": {
                        "type": "literal",
                        "value": string
                    },
                    "subregionName": {
                        "type": "literal",
                        "value": string
                    },
                    "subregionID": {
                        "type": "literal",
                        "value": string
                    },
                    "regionName": {
                        "type": "literal",
                        "value": string
                    },
                    "regionID": {
                        "type": "literal",
                        "value": string
                    }
                }
          */
          for (const binding of payload.data.results.bindings) {
            const regionId = binding.regionID.value;
            if (!(regionId in feederModel))
              feederModel[regionId] = {
                id: regionId,
                name: binding.regionName.value,
                lines: [],
                subregions: []
              };
            // If a line with given name by binding.name.value already exists, then filter it out
            // to push the new one on
            this._pushIfNameDoesNotExist(
              feederModel[regionId].lines,
              binding.name.value,
              {
                name: binding.name.value,
                id: binding.mRID.value,
                subregionId: binding.subregionID.value
              }
            );
            // If a subregion with given name by binding.subregionName.value already exists, then filter it out
            // to push the new one on
            this._pushIfNameDoesNotExist(
              feederModel[regionId].subregions,
              binding.subregionName.value,
              {
                name: binding.subregionName.value,
                id: binding.subregionID.value
              }
            );
          }
          this.setState({
            feederModel
          });
        }
      });
  }

  private _pushIfNameDoesNotExist(array: Array<{ name: string; id: string }>, nameValue: string, value: any) {
    if (array.every(item => item.name !== nameValue))
      array.push(value);
  }

  render() {
    return (
      <Route path='/' component={(props) =>
        this.shouldRedirect ? this.redirect() :
          <>
            <Navigation
              onShowSimulationConfigForm={
                (config: SimulationConfiguration) => this.showSimulationConfigForm(config, props.history)
              }>
              <Settings />
            </Navigation>
            <Route
              exact
              path='/topology'
              component={() => {
                return (
                  <div className='topology-renderer-simulation-status-logger-measurement-graphs'>
                    <div>
                      <SimulationControlContainer />
                      <TabGroup ref={ref => this.tabGroup = ref}>
                        <Tab label='Simulation'>
                          <TopologyRendererContainer
                            mRIDs={this.componentMRIDs}
                            phases={this.componentPhases} />
                          <SimulationStatusLogContainer />
                          <SimulationLabelsContainer />
                          <VoltageViolationContainer />
                        </Tab>
                        <Tab label='Events'>
                          <EventSummary />
                        </Tab>
                        <Tab label='Applications'>
                          <AvailableApplicationList />
                        </Tab>
                        <Tab label='Alarms'>
                          <AlarmsContainer onNewAlarmsConfirmed={() => this.tabGroup.setSelectedTabIndex(3)} />
                        </Tab>
                      </TabGroup>
                    </div>
                    <div className='measurement-charts'>
                      <MeasurementChartContainer />
                    </div>
                  </div>
                );
              }} />
            <Route
              exact
              path='/applications'
              component={AvailableApplicationsAndServices} />
            <Route
              exact
              path='/stomp-client'
              component={StompClientContainer} />
            <Route
              path='/browse'
              component={routeProps => <DataBrowser feederModel={this.state.feederModel} match={routeProps.match} />} />
            <WebsocketStatusWatcher />
          </>
      } />
    );
  }

  redirect() {
    this.shouldRedirect = false;
    return <Redirect to='/' />;
  }

  showSimulationConfigForm(config: SimulationConfiguration, browserHistory) {
    if (config === null)
      config = DEFAULT_SIMULATION_CONFIGURATION;
    this._overlayService.show(
      <SimulationConfigurationEditor
        feederModel={this.state.feederModel}
        onSubmit={updatedConfig => this.onSimulationConfigFormSubmitted(updatedConfig, browserHistory)}
        onClose={this._overlayService.hide}
        onMRIDChanged={(mRID, simulationName) => {
          if (!this._availableModelDictionaries.has(simulationName)) {
            // Clear out the currently active model dictionary
            this._stateStore.update({
              modelDictionary: null
            });
            this.fetchModelDictionary(mRID);
          }
          else
            this.processNewModelDictionary(this._availableModelDictionaries.get(simulationName));
        }}
        availableApplications={this.state.availableApplications}
        initialConfig={config} />
    );
  }

  onSimulationConfigFormSubmitted(config: SimulationConfiguration, history) {
    this._simulationQueue.push({
      name: config.simulation_config.simulation_name,
      config,
      id: ''
    });
    this._overlayService.hide();
    setTimeout(() => history.push('/topology'), 500);
  }

  fetchModelDictionary(mrid: string) {
    const getModelDictionaryRequest = new GetModelDictionaryRequest();
    getModelDictionaryRequest.requestBody.parameters.model_id = mrid;
    this._subscribeToModelDictionaryTopic(getModelDictionaryRequest);
    this._stompClientService.send(
      getModelDictionaryRequest.url,
      { 'reply-to': getModelDictionaryRequest.replyTo },
      JSON.stringify(getModelDictionaryRequest.requestBody)
    );
  }

  private _subscribeToModelDictionaryTopic(getModelDictionaryRequest: GetModelDictionaryRequest) {
    this._stompClientService.readOnceFrom(getModelDictionaryRequest.replyTo)
      .pipe(map(body => JSON.parse(body)))
      .subscribe({
        next: payload => {
          if (typeof payload.data === 'string')
            payload.data = JSON.parse(payload.data);
          const modelDictionary = payload.data.feeders[0];
          this.processNewModelDictionary(modelDictionary);
        }
      });
  }

  processNewModelDictionary(modelDictionary: ModelDictionary) {
    const modelDictionaryMeasurementMap = new Map<string, ModelDictionaryMeasurement>();
    for (const measurement of modelDictionary.measurements)
      modelDictionaryMeasurementMap.set(measurement.mRID, measurement);
    this._collectMRIDsAndPhasesForComponents(modelDictionary);
    this._simulationOutputService.updateModelDictionaryMeasurementMap(modelDictionaryMeasurementMap);
    this._consolidatePhasesForComponents(modelDictionary);
    this._stateStore.update({
      modelDictionary
    });
  }

  private _collectMRIDsAndPhasesForComponents(modelDictionary: any) {
    this.componentMRIDs.clear();
    this.componentPhases.clear();
    for (const swjtch of modelDictionary.switches)
      this.componentMRIDs.set(swjtch.name, swjtch.mRID);
    for (const capacitor of modelDictionary.capacitors)
      this.componentMRIDs.set(capacitor.name, capacitor.mRID);
    for (const regulator of modelDictionary.regulators) {
      this.componentMRIDs.set(regulator.bankName, regulator.mRID);
      // Only interested in regulators' phases for now, need phases for regulator menus
      this.componentPhases.set(regulator.bankName, (regulator.bankPhases || '').split(''));
    }
  }

  // Find components with the same name, and group their phases into one
  private _consolidatePhasesForComponents(modelDictionary: ModelDictionary) {
    const componentWithGroupPhasesMap = new Map<string, ModelDictionaryComponent>();
    for (const measurement of modelDictionary.measurements) {
      const id = measurement.measurementType === ModelDictionaryComponentType.VOLTAGE
        ? measurement.ConnectivityNode
        : measurement.ConductingEquipment_name;
      const phases = measurement.phases;
      let componentInMeasurement = componentWithGroupPhasesMap.get(id);
      if (!componentInMeasurement) {
        componentInMeasurement = {
          id,
          conductingEquipmentName: measurement.ConductingEquipment_name,
          conductingEquipmentType: measurement.ConductingEquipment_type,
          displayName: `${id} (${phases})`,
          phases: [phases],
          conductingEquipmentMRIDs: [measurement.ConductingEquipment_mRID],
          type: measurement.measurementType as ModelDictionaryComponentType
        };
        componentWithGroupPhasesMap.set(id, componentInMeasurement);
      } else {
        if (!componentInMeasurement.phases.includes(phases)) {
          componentInMeasurement.phases.push(phases);
          componentInMeasurement.phases.sort((a, b) => a.localeCompare(b));
          componentInMeasurement.displayName = `${id} (${componentInMeasurement.phases.join(', ')})`;
        }
        componentInMeasurement.conductingEquipmentMRIDs.push(measurement.ConductingEquipment_mRID);
      }
    }
    this._stateStore.update({
      modelDictionaryComponentsWithConsolidatedPhases: [...componentWithGroupPhasesMap.values()]
    });
  }

}
