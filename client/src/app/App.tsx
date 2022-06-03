import { useRef, useState } from 'react';
import { Outlet, Route, Routes, useNavigate } from 'react-router-dom';

import { Application } from '@client:common/Application';
import { MessageBanner } from '@client:common/overlay/message-banner';
import { StateStore } from '@client:common/state-store';
import { PortalRenderer } from '@client:common/overlay/portal-renderer';
import { waitUntil, download, DownloadType } from '@client:common/misc';
import { Dialog } from '@client:common/overlay/dialog';
import { StompClientConnectionStatus } from '@client:common/StompClientService';
import { SimulationConfiguration, DEFAULT_SIMULATION_CONFIGURATION } from '@client:common/simulation';
import { FeederModel } from '@client:common/topology';
import { ThreeDots } from '@client:common/three-dots';
import { AuthenticatorContainer } from '@client:common/authenticator';
import { TabGroup, Tab } from '@client:common/tabs';
import { DateTimeService } from '@client:common/DateTimeService';

import { AvailableApplicationsAndServicesContainer } from './available-applications-and-services';
import { DataBrowser } from './data-browser';
import { MeasurementValueTableContainer } from './simulation/measurement-value-table';
import { MeasurementChartContainer } from './simulation/measurement-chart';
import { SimulationConfigurationEditor } from './simulation/simulation-configuration-editor';
import { SimulationControlContainer } from './simulation/simulation-control';
import { SimulationStatusLogContainer } from './simulation/simulation-status-logger';
import { StompClientContainer } from './stomp-client';
import { TopologyRendererContainer } from './simulation/topology-renderer';
import { WebsocketStatusWatcherContainer } from './websocket-status-watcher';
import { EventSummary } from './simulation/event-summary';
import { AvailableApplicationList } from './simulation/applications/AvailableApplicationList';
import { VoltageViolationContainer } from './simulation/voltage-violation/VoltageViolationContainer';
import { NavigationContainer } from './navigation';
import { AlarmsContainer, Alarm } from './simulation/alarms';
import { Settings } from './settings';
import { ExpectedResultComparisonContainer } from './expected-result-comparison';

import './App.light.scss';
import './App.dark.scss';

interface Props {
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

export function App(props: Props) {
  const tabGroupRef = useRef<TabGroup>(null);
  const stateStore = StateStore.getInstance();
  const dateTimeService = DateTimeService.getInstance();
  const navigate = useNavigate();
  const [simulationRequest, setSimulationRequest] = useState(null);

  const onShowSimulationConfigForm = (config: SimulationConfiguration, isUploaded: boolean) => {
    const portalRenderer = new PortalRenderer();
    portalRenderer.mount(
      <SimulationConfigurationEditor
        isUploaded={isUploaded}
        feederModel={props.feederModel}
        onSubmit={updatedConfig => {
          setSimulationRequest(updatedConfig);
          props.onSimulationConfigFormSubmitted(updatedConfig);
          setTimeout(() => navigate('/simulation'), 500);
        }}
        onClose={portalRenderer.unmount}
        onMRIDChanged={props.onMRIDChanged}
        availableApplications={props.availableApplications}
        initialConfig={config || DEFAULT_SIMULATION_CONFIGURATION} />
    );
  };

  const onJoinActiveSimulation = (simulationId: string) => {
    navigate('/simulation');
    props.onJoinActiveSimulation(simulationId);
  };

  const onShowExpectedResultViewer = () => {
    Dialog.create(<ExpectedResultComparisonContainer />)
      .addClassName('expected-result-comparison-container')
      .addNegativeButton('Close')
      .open();
  };

  const onLocateNodeForAlarm = (alarm: Alarm) => {
    tabGroupRef.current.setSelectedTabIndex(0);
    waitUntil(() => tabGroupRef.current.isTabVisible(0))
      .then(() => {
        stateStore.update({
          nodeNameToLocate: alarm.equipment_name
        });
      });
  };

  const downloadSimulationConfiguration = () => {
    // convert start_time to GMT and save it to the exported configuration file.
    const convertStartTimeToGMT = dateTimeService.convertToGMT(simulationRequest.simulation_config.start_time).toString();
    // When other users in different time zones, recevied this file, they only need to convert the GMT to their time zone time
    // eslint-disable-next-line camelcase
    const simulationConfigRequestToDownload = {...simulationRequest, simulation_config:{...simulationRequest.simulation_config, start_time: convertStartTimeToGMT}};
    download('simulationRequestConfig', JSON.stringify(simulationConfigRequestToDownload), DownloadType.JSON);
  };

  return (
    <Routes>
      <Route
        path='/'
        element={
          <AuthenticatorContainer>
            <NavigationContainer
              onShowSimulationConfigForm={onShowSimulationConfigForm}
              onLogout={props.onLogout}
              onJoinActiveSimulation={onJoinActiveSimulation}
              onShowExpectedResultViewer={onShowExpectedResultViewer}>
              <Settings />
            </NavigationContainer>
            <Outlet />
            <WebsocketStatusWatcherContainer />
            {
              props.stompClientConnectionStatus === StompClientConnectionStatus.CONNECTED
              &&
              (props.availableApplications === null || props.feederModel === null)
              &&
              <MessageBanner>
                Initializing<ThreeDots />
              </MessageBanner>
            }
          </AuthenticatorContainer>
        }>
        <Route
          path='simulation'
          element={
            <div className='topology-renderer-simulation-status-logger-measurement-graphs'>
              <div>
                <SimulationControlContainer exportSimulationConfiguration={downloadSimulationConfiguration}/>
                <TabGroup ref={tabGroupRef}>
                  <Tab label='Simulation'>
                    <TopologyRendererContainer
                      mRIDs={props.componentMRIDs}
                      phases={props.componentPhases} />
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
                      onNewAlarmsConfirmed={() => tabGroupRef.current.setSelectedTabIndex(3)}
                      onLocateNodeForAlarm={onLocateNodeForAlarm} />
                  </Tab>
                </TabGroup>
              </div>
              <div className='measurement-charts'>
                <MeasurementChartContainer />
              </div>
            </div>} />
        <Route
          path='applications-and-services'
          element={<AvailableApplicationsAndServicesContainer />} />
        <Route
          path='stomp-client'
          element={<StompClientContainer />} />
        <Route
          path='browse/*'
          element={<DataBrowser feederModel={props.feederModel} />} />
      </Route>
    </Routes>
  );


}
