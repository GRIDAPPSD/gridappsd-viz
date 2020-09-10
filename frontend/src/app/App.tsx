import * as React from 'react';
import { Route, Redirect, withRouter, RouteComponentProps } from 'react-router-dom';

import { Application } from '@shared/Application';
import { AvailableApplicationsAndServicesContainer } from './available-applications-and-services';
import { DataBrowser } from './data-browser';
import { FeederModel } from '@shared/topology';
import { MeasurementValueTableContainer } from './simulation/measurement-value-table';
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
import { AlarmsContainer, Alarm } from './simulation/alarms';
import { Settings } from './settings';
import { MessageBanner } from '@shared/overlay/message-banner';
import { ThreeDots } from '@shared/three-dots';
import { StompClientConnectionStatus } from '@shared/StompClientService';
import { StateStore } from '@shared/state-store';
import { waitUntil } from '@shared/misc';
import { PortalRenderer } from '@shared/overlay/portal-renderer';
import { Dialog } from '@shared/overlay/dialog';
import { ExpectedResultComparisonContainer } from './simulation/expected-result-comparison';

import './App.light.scss';
import './App.dark.scss';

interface Props extends RouteComponentProps {
  feederModel: FeederModel;
  availableApplications: Application[];
  componentMRIDs: Map<string, string | string[]>;
  componentPhases: Map<string, string[]>;
  stompClientConnectionStatus: StompClientConnectionStatus;
  onLogout: () => void;
  onMRIDChanged: (mRID: string) => void;
  onSimulationConfigFormSubmitted: (simulationConfig: SimulationConfiguration) => void;
  onJoinActiveSimulation: (simulationId: string) => void;
}

interface State {
}

export const App = withRouter(class extends React.Component<Props, State> {

  readonly tabGroupRef = React.createRef<TabGroup>();

  shouldRedirect = false;

  private readonly _stateStore = StateStore.getInstance();

  constructor(props: Props) {
    super(props);

    this.showSimulationConfigForm = this.showSimulationConfigForm.bind(this);
    this.onJoinActiveSimulation = this.onJoinActiveSimulation.bind(this);
    this.onLocateNodeForAlarm = this.onLocateNodeForAlarm.bind(this);
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
                onJoinActiveSimulation={this.onJoinActiveSimulation}
                onShowExpectedResultViewer={this.onShowExpectedResultViewer}>
                <Settings />
              </NavigationContainer>
              <Route
                exact
                path='/simulation'
                component={() => (
                  <div className='topology-renderer-simulation-status-logger-measurement-graphs'>
                    <div>
                      <SimulationControlContainer />
                      <TabGroup ref={this.tabGroupRef}>
                        <Tab label='Simulation'>
                          <TopologyRendererContainer
                            mRIDs={this.props.componentMRIDs}
                            phases={this.props.componentPhases} />
                          <SimulationStatusLogContainer />
                          <MeasurementValueTableContainer />
                          <VoltageViolationContainer />
                        </Tab>
                        <Tab label='Events'>
                          <EventSummary />
                        </Tab>
                        <Tab label='Applications'>
                          <AvailableApplicationList />
                        </Tab>
                        <Tab label='Alarms'>
                          <AlarmsContainer
                            onNewAlarmsConfirmed={() => this.tabGroupRef.current.setSelectedTabIndex(3)}
                            onLocateNodeForAlarm={this.onLocateNodeForAlarm} />
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
                <MessageBanner>
                  Initializing<ThreeDots />
                </MessageBanner>
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
    const portalRenderer = new PortalRenderer();
    portalRenderer.mount(
      <SimulationConfigurationEditor
        feederModel={this.props.feederModel}
        onSubmit={updatedConfig => {
          this.props.onSimulationConfigFormSubmitted(updatedConfig);
          setTimeout(() => this.props.history.push('/simulation'), 500);
        }}
        onClose={portalRenderer.unmount}
        onMRIDChanged={this.props.onMRIDChanged}
        availableApplications={this.props.availableApplications}
        initialConfig={config || DEFAULT_SIMULATION_CONFIGURATION} />
    );
  }

  onJoinActiveSimulation(simulationId: string) {
    this.props.history.push('/simulation');
    this.props.onJoinActiveSimulation(simulationId);
  }

  onShowExpectedResultViewer() {
    Dialog.create(<ExpectedResultComparisonContainer />)
      .addClassName('expected-result-comparison-container')
      .addNegativeButton('Close')
      .open();
  }

  onLocateNodeForAlarm(alarm: Alarm) {
    this.tabGroupRef.current.setSelectedTabIndex(0);
    waitUntil(() => this.tabGroupRef.current.isTabVisible(0))
      .then(() => {
        this._stateStore.update({
          nodeNameToLocate: alarm.equipment_name
        });
      });
  }

});
