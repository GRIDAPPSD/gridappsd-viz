import * as React from 'react';
import { Route, Redirect, withRouter } from 'react-router-dom';

import { Application } from '@shared/Application';
import { AvailableApplicationsAndServicesContainer } from './available-applications-and-services';
import { DataBrowser } from './data-browser';
import { FeederModel } from '@shared/topology';
import { SimulationLabelsContainer } from './simulation/simulation-labels';
import { MeasurementChartContainer } from './simulation/measurement-chart';
import { SimulationConfiguration, DEFAULT_SIMULATION_CONFIGURATION } from '@shared/simulation';
import { SimulationConfigurationEditor } from './simulation/simulation-configuration';
import { SimulationControlContainer } from './simulation/simulation-control';
import { SimulationStatusLogContainer } from './simulation/simulation-status-logger';
import { StompClientContainer } from './stomp-client';
import { TopologyRendererContainer } from './simulation/topology-renderer';
import { WebsocketStatusWatcher } from './websocket-status-watcher';
import { TabGroup, Tab } from '@shared/tabs';
import { EventSummary } from './simulation/event-summary/EventSummary';
import { AvailableApplicationList } from './simulation/applications/AvailableApplicationList';
import { VoltageViolationContainer } from './simulation/voltage-violation/VoltageViolationContainer';
import { NavigationContainer } from './navigation';
import { Authenticator } from '@shared/authenticator';
import { AlarmsContainer } from './simulation/alarms';
import { Settings } from './settings';
import { NotificationBanner } from '@shared/notification-banner';
import { ThreeDots } from '@shared/three-dots';
import { OverlayService } from '@shared/overlay';
import { StompClientConnectionStatus } from '@shared/StompClientService';

import './App.light.scss';
import './App.dark.scss';

interface Props {
  feederModel: FeederModel;
  availableApplications: Application[];
  componentMRIDs: Map<string, string & string[]>;
  componentPhases: Map<string, string[]>;
  stompClientConnectionStatus: StompClientConnectionStatus;
  onLogout: () => void;
  onMRIDChanged: (mRID: string) => void;
  onSimulationConfigFormSubmitted: (simulationConfig: SimulationConfiguration) => void;
  onJoinActiveSimulation: (simulationId: string) => void;
  history: any;
}

interface State {
}

export const App = (withRouter as any)(class extends React.Component<Props, State> {

  readonly overlayService = OverlayService.getInstance();

  shouldRedirect = false;
  tabGroup: TabGroup;

  constructor(props: Props) {
    super(props);

    this.showSimulationConfigForm = this.showSimulationConfigForm.bind(this);
    this.onJoinActiveSimulation = this.onJoinActiveSimulation.bind(this);
  }

  componentDidCatch() {
    this.shouldRedirect = true;
  }

  render() {
    return (
      <Route path='/' component={() =>
        this.shouldRedirect
          ? this.redirect()
          : (
            <Authenticator>
              <NavigationContainer
                onShowSimulationConfigForm={this.showSimulationConfigForm}
                onLogout={this.props.onLogout}
                onJoinActiveSimulation={this.onJoinActiveSimulation}>
                <Settings />
              </NavigationContainer>
              <Route
                exact
                path='/simulation'
                component={() => (
                  <div className='topology-renderer-simulation-status-logger-measurement-graphs'>
                    <div>
                      <SimulationControlContainer />
                      <TabGroup ref={ref => this.tabGroup = ref}>
                        <Tab label='Simulation'>
                          <TopologyRendererContainer
                            mRIDs={this.props.componentMRIDs}
                            phases={this.props.componentPhases} />
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
                )} />
              <Route
                exact
                path='/applications-and-services'
                component={AvailableApplicationsAndServicesContainer} />
              <Route
                exact
                path='/stomp-client'
                component={StompClientContainer} />
              <Route
                path='/browse'
                component={routeProps => <DataBrowser feederModel={this.props.feederModel} match={routeProps.match} />} />
              <WebsocketStatusWatcher />
              {
                this.props.stompClientConnectionStatus === StompClientConnectionStatus.CONNECTED
                &&
                (this.props.availableApplications === null || this.props.feederModel === null)
                &&
                <NotificationBanner persistent>
                  Initializing<ThreeDots />
                </NotificationBanner>
              }
            </Authenticator>
          )
      } />
    );
  }

  redirect() {
    this.shouldRedirect = false;
    return <Redirect to='/' />;
  }

  showSimulationConfigForm(config: SimulationConfiguration) {
    this.overlayService.show(
      <SimulationConfigurationEditor
        feederModel={this.props.feederModel}
        onSubmit={updatedConfig => {
          this.props.onSimulationConfigFormSubmitted(updatedConfig);
          this.overlayService.hide();
          setTimeout(() => this.props.history.push('/simulation'), 500);
        }}
        onClose={this.overlayService.hide}
        onMRIDChanged={this.props.onMRIDChanged}
        availableApplications={this.props.availableApplications}
        initialConfig={config || DEFAULT_SIMULATION_CONFIGURATION} />
    );
  }

  onJoinActiveSimulation(simulationId: string) {
    this.props.history.push('/simulation');
    this.props.onJoinActiveSimulation(simulationId);
  }

});
