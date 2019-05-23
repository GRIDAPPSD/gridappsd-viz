import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { map, take, filter } from 'rxjs/operators';

import { Application } from '@shared/Application';
import { AvailableApplicationsAndServices } from './available-applications-and-services';
import { DataBrowser } from './data-browser';
import { FeederModel } from '@shared/FeederModel';
import { GetAllFeederModelsRequest } from './models/message-requests/GetAllFeederModelsRequest';
import { LabelContainer } from './simulation/label';
import { MeasurementChartContainer } from './simulation/measurement-chart';
import { ModelDictionaryMeasurement } from './models/model-dictionary';
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

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _overlayService = OverlayService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _modelDictionaryMeasurementsPerSimulationName: { [name: string]: { [mRID: string]: ModelDictionaryMeasurement } } = {};
  private readonly _availableModelDictionaries = {};

  constructor(props: any) {
    super(props);

    this.state = {
      feederModels: null,
      availableApplications: null
    };
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
              onShowSimulationConfigForm={(config: SimulationConfiguration) => this.showSimulationConfigForm(config, props.history)} />
            <Route
              exact
              path='/topology'
              component={() => {
                return (
                  <>
                    <div className='topology-renderer-simulation-status-logger-measurement-graphs'>
                      <div className='topology-renderer-simulation-status-logger'>
                        <SimulationControlContainer />
                        <TopologyRendererContainer
                          mRIDs={this.componentMrids}
                          phases={this.componentPhases} />
                        <SimulationStatusLogContainer />
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
    this._overlayService.show(
      <SimulationConfigurationEditor
        feederModels={this.state.feederModels}
        onSubmit={config => this._onSimulationConfigFormSubmitted(config, browserHistory)}
        onClose={() => this._overlayService.hide()}
        onMRIDChanged={(mRID, simulationName) => {
          if (!this._modelDictionaryMeasurementsPerSimulationName[simulationName])
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
    if (mrid in this._availableModelDictionaries)
      return;
    const getModelDictionaryRequest = new GetModelDictionaryRequest();
    this._availableModelDictionaries[mrid] = true;
    getModelDictionaryRequest.requestBody.parameters.model_id = mrid;
    this._subscribeToModelDictionaryTopic(getModelDictionaryRequest, simulationName);
    this._stompClientService.send(
      getModelDictionaryRequest.url,
      { 'reply-to': getModelDictionaryRequest.replyTo },
      JSON.stringify(getModelDictionaryRequest.requestBody)
    );
  }

  private _subscribeToModelDictionaryTopic(getModelDictionaryRequest: GetModelDictionaryRequest, simulationName: string) {
    this._stompClientService.readOnceFrom(getModelDictionaryRequest.replyTo)
      .pipe(map(body => JSON.parse(body)))
      .subscribe({
        next: payload => {
          if (typeof payload.data === 'string')
            payload.data = JSON.parse(payload.data);
          const feeders = payload.data.feeders[0];
          const modelDictionaryMeasurements = feeders.measurements.reduce((accummulator, measurement) => {
            accummulator[measurement.mRID] = measurement;
            return accummulator;
          }, {});
          this._simulationOutputService.setModelDictionaryMeasurements(modelDictionaryMeasurements);
          this._modelDictionaryMeasurementsPerSimulationName[simulationName] = modelDictionaryMeasurements;
          this._collectMRIDsAndPhasesForComponents(feeders);
        }
      });
  }

  private _collectMRIDsAndPhasesForComponents(feeders: any) {
    for (const swjtch of feeders.switches)
      this.componentMrids.set(swjtch.name, swjtch.mRID);
    for (const capacitor of feeders.capacitors)
      this.componentMrids.set(capacitor.name, capacitor.mRID);
    for (const regulator of feeders.regulators) {
      this.componentMrids.set(regulator.bankName, regulator.mRID);
      // Only interested in regulators' phases for now, need phases for regulator menus
      this.componentPhases.set(regulator.bankName, (regulator.bankPhases || '').split(''));
    }
  }

}
