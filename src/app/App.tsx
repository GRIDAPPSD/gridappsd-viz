import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { map, take, filter } from 'rxjs/operators';

import { Application } from '@shared/Application';
import { AvailableApplicationsAndServices } from './available-applications-and-services';
import { DataBrowser } from './data-browser';
import { FeederModel } from '@shared/topology';
import { GetAllFeederModelsRequest } from './models/message-requests/GetAllFeederModelsRequest';
import { LabelContainer } from './simulation/label';
import { MeasurementChartContainer } from './simulation/measurement-chart';
import { ModelDictionaryMeasurement, ModelDictionary } from '@shared/topology/model-dictionary';
import { Navigation } from './navigation';
import { OverlayService } from '@shared/overlay';
import { SimulationConfiguration } from '@shared/simulation';
import { SimulationConfigurationEditor } from './simulation/simulation-configuration';
import { SimulationControlContainer } from './simulation/simulation-control';
import { SimulationQueue, SimulationOutputService } from '@shared/simulation';
import { SimulationStatusLogContainer } from './simulation/simulation-status-logger';
import { StompClientContainer } from './stomp-client';
import { StompClientService } from '@shared/StompClientService';
import { TopologyRendererContainer } from './topology-renderer';
import { WebsocketStatusWatcher } from './websocket-status-watcher';
import { GetModelDictionaryRequest } from './models/message-requests/GetModelDictionaryRequest';
import {
  GetAvailableApplicationsRequest, GetAvailableApplicationsRequestPayload
} from './models/message-requests/GetAvailableApplicationsAndServicesRequest';
import { DEFAULT_SIMULATION_CONFIGURATION } from './models/default-simulation-configuration';
import { ModelDictionaryTracker } from './simulation/simulation-configuration/services/ModelDictionaryTracker';
import { Store } from '@shared/Store';
import { ApplicationState } from '@shared/ApplicationState';
import { DEFAULT_APPLICATION_STATE } from './models/default-application-state';
import { TabGroup, Tab } from '@shared/tabs';
import { FaultEventSummary } from './fault-event-summary/FaultEventSummary';

import './App.scss';

interface Props {
}

interface State {
  feederModels: FeederModel;
  availableApplications: Application[];
}

export class App extends React.Component<Props, State> {
  shouldRedirect = false;
  readonly componentMrids = new Map<string, string & string[]>();
  readonly componentPhases = new Map<string, string[]>();

  private _store = Store.getInstance<ApplicationState>();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _overlayService = OverlayService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _modelDictionaryTracker = ModelDictionaryTracker.getInstance();
  private readonly _modelDictionaryMeasurementsPerSimulationName = new Map<string, Map<string, ModelDictionaryMeasurement>>();
  private readonly _availableModelDictionaries = new Map<string, ModelDictionary>();

  constructor(props: any) {
    super(props);

    this.state = {
      feederModels: null,
      availableApplications: null
    };

    this._store.initialize(DEFAULT_APPLICATION_STATE);
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
          this._fetchAvailableApplications();
          this._fetchFeederModels();
        }
      });
  }

  private _fetchAvailableApplications() {
    const getAvailableApplications = new GetAvailableApplicationsRequest();
    this._subscribeToAvailableApplicationsTopic(getAvailableApplications.replyTo);
    this._stompClientService.send(
      getAvailableApplications.url,
      { 'reply-to': getAvailableApplications.replyTo },
      JSON.stringify(getAvailableApplications.requestBody)
    );
  }

  private _subscribeToAvailableApplicationsTopic(destination: string) {
    this._stompClientService.readOnceFrom(destination)
      .pipe(map(body => JSON.parse(body) as GetAvailableApplicationsRequestPayload))
      .subscribe({
        next: payload => this.setState({ availableApplications: payload.applications })
      });
  }

  private _fetchFeederModels() {
    if (sessionStorage.getItem('regions')) {
      const regions = JSON.parse(sessionStorage.getItem('regions'));
      const subregions = JSON.parse(sessionStorage.getItem('subregions'));
      const lines = JSON.parse(sessionStorage.getItem('lines'));
      const mRIDs = lines.map((line, index) => ({ displayName: line.name, value: line.mRID, index }));
      this.setState({ feederModels: { regions, subregions, lines, mRIDs } });
    }
    else {
      const getAllFeederModelsRequest = new GetAllFeederModelsRequest();
      this._subscribeToFeederModelsTopic(getAllFeederModelsRequest.replyTo);
      this._stompClientService.send(
        getAllFeederModelsRequest.url,
        { 'reply-to': getAllFeederModelsRequest.replyTo },
        getAllFeederModelsRequest.requestBody
      );
    }
  }

  private _subscribeToFeederModelsTopic(destination: string) {
    this._stompClientService.readOnceFrom(destination)
      .pipe(map(body => JSON.parse(body)))
      .subscribe({
        next: payload => {
          const regions = [];
          const subregions = [];
          const lines = [];
          if (typeof payload.data === 'string')
            payload.data = JSON.parse(payload.data);
          payload.data.results.bindings.forEach((binding, index) => {
            this._addIfNotExists(
              regions,
              { regionName: binding.regionName.value, regionID: binding.regionID.value, index },
              'regionName'
            );
            this._addIfNotExists(
              subregions,
              { subregionName: binding.subregionName.value, subregionID: binding.subregionID.value, index },
              'subregionName'
            );
            this._addIfNotExists(
              lines,
              { name: binding.name.value, mRID: binding.mRID.value, index },
              'name'
            );
          });
          const mRIDs = lines.map((line, index) => ({ displayName: line.name, value: line.mRID, index }));
          this.setState({ feederModels: { regions, subregions, lines, mRIDs } });
          sessionStorage.setItem('regions', JSON.stringify(regions));
          sessionStorage.setItem('subregions', JSON.stringify(subregions));
          sessionStorage.setItem('lines', JSON.stringify(lines));
        }
      });
  }

  private _addIfNotExists(array: any[], object: any, key: string) {
    if (array.every(e => e[key] !== object[key]))
      array.push(object);
  }

  render() {
    return (
      <Route path='/' component={(props) =>
        this.shouldRedirect ? this.redirect() :
          <>
            <Navigation
              onShowSimulationConfigForm={
                (config: SimulationConfiguration) => this.showSimulationConfigForm(config, props.history)
              } />
            <Route
              exact
              path='/topology'
              component={() => {
                return (
                  <>
                    <div className='topology-renderer-simulation-status-logger-measurement-graphs'>
                      <div>
                        <SimulationControlContainer />
                        <TabGroup>
                          <Tab label='Simulation'>
                            <TopologyRendererContainer
                              mRIDs={this.componentMrids}
                              phases={this.componentPhases} />
                            <SimulationStatusLogContainer />
                          </Tab>
                          <Tab label='Events'>
                            <FaultEventSummary />
                          </Tab>
                        </TabGroup>
                      </div>
                      <div className='measurement-charts'>
                        <MeasurementChartContainer />
                      </div>
                    </div>
                    <LabelContainer />
                  </>
                );
              }} />
            <Route exact path='/applications' component={AvailableApplicationsAndServices} />
            <Route exact path='/stomp-client' component={StompClientContainer} />
            <Route path='/browse' component={props => <DataBrowser mRIDs={this.state.feederModels.mRIDs} match={props.match} />} />
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
        feederModels={this.state.feederModels}
        onSubmit={updatedConfig => this._onSimulationConfigFormSubmitted(updatedConfig, browserHistory)}
        onClose={() => this._overlayService.hide()}
        onMRIDChanged={(mRID, simulationName) => {
          if (!this._modelDictionaryMeasurementsPerSimulationName.has(simulationName))
            this._fetchModelDictionary(mRID, simulationName);
        }}
        availableApplications={this.state.availableApplications}
        initialConfig={config} />
    );
  }

  private _onSimulationConfigFormSubmitted(config: SimulationConfiguration, history) {
    this._simulationQueue.push({
      name: config.simulation_config.simulation_name,
      config,
      id: ''
    });
    this._overlayService.hide();
    setTimeout(() => history.push('/topology'), 500);
  }

  private _fetchModelDictionary(mrid: string, simulationName: string) {
    if (!this._availableModelDictionaries.has(simulationName)) {
      const getModelDictionaryRequest = new GetModelDictionaryRequest();
      getModelDictionaryRequest.requestBody.parameters.model_id = mrid;
      this._subscribeToModelDictionaryTopic(getModelDictionaryRequest, simulationName);
      this._stompClientService.send(
        getModelDictionaryRequest.url,
        { 'reply-to': getModelDictionaryRequest.replyTo },
        JSON.stringify(getModelDictionaryRequest.requestBody)
      );
    }
    else
      this._modelDictionaryTracker.selectCurrentModelDictionary(this._availableModelDictionaries.get(simulationName));
  }

  private _subscribeToModelDictionaryTopic(getModelDictionaryRequest: GetModelDictionaryRequest, simulationName: string) {
    this._stompClientService.readOnceFrom(getModelDictionaryRequest.replyTo)
      .pipe(map(body => JSON.parse(body)))
      .subscribe({
        next: payload => {
          if (typeof payload.data === 'string')
            payload.data = JSON.parse(payload.data);
          const modelDictionary = payload.data.feeders[0];
          const modelDictionaryMeasurements = new Map<string, ModelDictionaryMeasurement>();
          for (const measurement of modelDictionary.measurements)
            modelDictionaryMeasurements.set(measurement.mRID, measurement);
          this._collectMRIDsAndPhasesForComponents(modelDictionary);
          this._simulationOutputService.setModelDictionaryMeasurements(modelDictionaryMeasurements);
          this._modelDictionaryMeasurementsPerSimulationName.set(simulationName, modelDictionaryMeasurements);
          this._availableModelDictionaries.set(simulationName, modelDictionary);
          this._modelDictionaryTracker.selectCurrentModelDictionary(this._availableModelDictionaries.get(simulationName));
        }
      });
  }

  private _collectMRIDsAndPhasesForComponents(modelDictionary: any) {
    for (const swjtch of modelDictionary.switches)
      this.componentMrids.set(swjtch.name, swjtch.mRID);
    for (const capacitor of modelDictionary.capacitors)
      this.componentMrids.set(capacitor.name, capacitor.mRID);
    for (const regulator of modelDictionary.regulators) {
      this.componentMrids.set(regulator.bankName, regulator.mRID);
      // Only interested in regulators' phases for now, need phases for regulator menus
      this.componentPhases.set(regulator.bankName, (regulator.bankPhases || '').split(''));
    }
  }

}
