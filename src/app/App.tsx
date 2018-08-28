import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';

import { Navigation } from './navigation/Navigation';
import { DatabaseBrowser } from './database-browser/DatabaseBrowser';
import { StompClientContainer } from './stomp-client/StompClientContainer';
import { SimulationConfiguration } from './simulation/simulation-configuration/SimulationConfiguration';
import { OverlayService } from './shared/views/overlay/OverlayService';
import { DEFAULT_SIMULATION_CONFIG } from './models/default-simulation-config';
import { FeederModels } from './models/FeederModels';
import { SimulationQueue } from './services/SimulationQueue';
import { TopologyRendererContainer } from './topology-renderer/TopologyRendererContainer';
import { ModelDictionaryMeasurement } from './models/model-dictionary/ModelDictionaryMeasurement';
import { MessageService } from './services/MessageService';
import { StompSubscription } from '@stomp/stompjs';
import { GetAllFeederModelsRequestPayload } from './models/message-requests/GetAllFeederModelsRequest';
import { ModelDictionary } from './models/model-dictionary/ModelDictionary';
import { RequestConfigurationType } from './models/message-requests/RequestConfigurationType';
import { SimulationConfig } from './models/SimulationConfig';
import { SimulationOutputService } from './services/SimulationOutputService';
import { MeasurementGraphContainer } from './simulation/measurement-graph/MeasurementGraphContainer';
import { SimulationStatusLoggerContainer } from './simulation/simulation-status-logger/SimulationStatusLoggerContainer';
import { SimulationControlContainer } from './simulation/simulation-control/SimulationControlContainer';
import { AvailableApplicationsAndServices } from './available-applications-and-services/AvailableApplicationsAndServices';

import './App.scss';

interface Props {
}

interface State {
  feederModels: FeederModels;
}

export class App extends React.Component<Props, State> {
  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _overlayService = OverlayService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _modelDictionaryMeasurementsPerSimulationName: { [name: string]: { [mRID: string]: ModelDictionaryMeasurement } } = {};
  private readonly _messageService = MessageService.getInstance();
  private _shouldRedirect = false;

  constructor(props: any) {
    super(props);
  }

  componentDidCatch() {
    this._shouldRedirect = true;
  }

  componentDidMount() {
    this._fetchFeederModels();
    this._subscribeToModelDictionaryTopic();
  }

  render() {
    return (
      <Route path='/' component={(props) =>
        this._shouldRedirect ? this._redirect() :
          <>
            <Navigation
              onShowSimulationConfigForm={(config: SimulationConfig) => this._showSimulationConfigForm(config, props.history)} />
            <Route
              exact
              path='/topology'
              component={match =>
                <div className='topology-renderer-simulation-status-logger-measurement-graphs'>
                  <div className='topology-renderer-simulation-status-logger'>
                    <SimulationControlContainer simulationConfig={this._simulationQueue.getActiveSimulation().config} />
                    <TopologyRendererContainer />
                    <SimulationStatusLoggerContainer />
                  </div>
                  <div className='measurement-graphs'>
                    <MeasurementGraphContainer simulationName={this._simulationQueue.getActiveSimulation().name} />
                  </div>
                </div>
              } />
            <Route exact path='/applications' component={AvailableApplicationsAndServices} />
            <Route exact path='/stomp-client' component={StompClientContainer} />
            <Route path='/browse' component={props => <DatabaseBrowser mRIDs={this.state.feederModels.mRIDs} match={props.match} />} />
          </>
      }>
      </Route>
    );
  }

  private _addIfNotExists(array: any[], object: any, key: string) {
    if (array.every(e => e[key] !== object[key]))
      array.push(object);
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
      const repeater = setInterval(() => {
        if (this._messageService.isActive()) {
          const sub: StompSubscription = this._messageService.onFeederModelsReceived((payload: GetAllFeederModelsRequestPayload) => {
            const regions = [];
            const subregions = [];
            const lines = [];
            let index = 0;
            if (typeof payload.data === 'string')
              payload.data = JSON.parse(payload.data);
            for (const binding of payload.data.results.bindings) {
              this._addIfNotExists(regions, { regionName: binding.regionName.value, regionID: binding.regionID.value, index }, 'regionName');
              this._addIfNotExists(subregions, { subregionName: binding.subregionName.value, subregionID: binding.subregionID.value, index }, 'subregionName');
              this._addIfNotExists(lines, { name: binding.name.value, mRID: binding.mRID.value, index }, 'name');
              index++;
            }
            const mRIDs = lines.map((line, index) => ({ displayName: line.name, value: line.mRID, index }));
            this.setState({ feederModels: { regions, subregions, lines, mRIDs } });
            sub.unsubscribe();
            sessionStorage.setItem('regions', JSON.stringify(regions));
            sessionStorage.setItem('subregions', JSON.stringify(subregions));
            sessionStorage.setItem('lines', JSON.stringify(lines));
          });
          this._messageService.fetchAllFeederModels();
          clearInterval(repeater);
        }
      }, 500);
    }
  }

  private _onSimulationConfigFormSubmitted(config: SimulationConfig, history) {
    this._simulationQueue.push({
      name: config.simulation_config.simulation_name,
      config,
      id: config.simulation_config.simulation_name
    });
    this._overlayService.hide();
    requestAnimationFrame(() => history.push('/topology'));
  }

  private _redirect() {
    this._shouldRedirect = false;
    return <Redirect to='/' />;
  }

  private _subscribeToModelDictionaryTopic() {
    const repeater = setInterval(() => {
      if (this._messageService.isActive()) {
        this._messageService.onModelDictionaryReceived((payload: ModelDictionary, simulationName: string) => {
          if (payload.requestType === RequestConfigurationType.CIM_DICTIONARY) {
            if (typeof payload.data === 'string')
              payload.data = JSON.parse(payload.data);
            const modelDictionaryMeasurements = payload.data.feeders[0].measurements.reduce(
              (result, measurement) => {
                result[measurement.mRID] = measurement;
                return result;
              },
              {}
            );
            this._simulationOutputService.setModelDictionaryMeasures(modelDictionaryMeasurements);
            this._modelDictionaryMeasurementsPerSimulationName[simulationName] = modelDictionaryMeasurements;
          }
        });
        clearInterval(repeater);
      }
    }, 500);

  }

  private _showSimulationConfigForm(config: SimulationConfig, browserHistory) {
    this._overlayService.show(
      <SimulationConfiguration
        feederModels={this.state.feederModels}
        onSubmit={config => this._onSimulationConfigFormSubmitted(config, browserHistory)}
        onClose={() => this._overlayService.hide()}
        onMRIDChanged={(mRID, simulationName) => {
          if (!this._modelDictionaryMeasurementsPerSimulationName[simulationName])
            this._messageService.fetchModelDictionary(mRID, simulationName);
        }}
        initialConfig={config} />
    );
  }

}