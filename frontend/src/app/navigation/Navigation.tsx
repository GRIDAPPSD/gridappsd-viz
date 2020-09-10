import * as React from 'react';
import { Link } from 'react-router-dom';

import { Drawer } from './views/drawer/Drawer';
import { ToolBar } from './views/tool-bar/ToolBar';
import { DrawerItem, DrawerItemIcon, DrawerItemLabel } from './views/drawer/DrawerItem';
import { DrawerItemGroup } from './views/drawer/DrawerItemGroup';
import { AppBranding } from './views/app-branding/AppBranding';
import { WebSocketConnectedIndicator } from './views/websocket-connected-indicator/WebSocketConnectedIndicator';
import { SimulationConfiguration, Simulation } from '@shared/simulation';
import { StompClientConnectionStatus } from '@shared/StompClientService';
import { IconButton } from '@shared/buttons';
import { Restricted } from '@shared/authenticator';
import { ExpectedResultComparisonType } from '@shared/ExpectedResultComparisonType';

import './Navigation.light.scss';
import './Navigation.dark.scss';

interface Props {
  previousSimulations: Simulation[];
  stompClientConnectionStatus: StompClientConnectionStatus;
  version: string;
  activeSimulationIds: string[];
  onShowSimulationConfigForm: (config: SimulationConfiguration) => void;
  onLogout: () => void;
  onJoinActiveSimulation: (simulationId: string) => void;
  onSelectExpectedResultComparisonType: (selectedType: ExpectedResultComparisonType) => void;
}

export class Navigation extends React.Component<Props, {}> {

  readonly drawerRef = React.createRef<Drawer>();

  constructor(props: Props) {
    super(props);

    this.openDrawer = this.openDrawer.bind(this);
  }

  render() {
    return (
      <>
        <ToolBar>
          <IconButton
            style='primary'
            className='drawer-opener'
            icon='menu'
            size='large'
            rippleDuration={550}
            hasBackground={false}
            onClick={this.drawerRef.current?.open} />
          <AppBranding version={this.props.version} />
          <div className='right-aligned'>
            <WebSocketConnectedIndicator websocketStatus={this.props.stompClientConnectionStatus} />
            {
              this.props.children
            }
          </div>
        </ToolBar>
        <Drawer ref={this.drawerRef}>
          {
            this.props.activeSimulationIds.length > 0
            &&
            <DrawerItemGroup
              header='Join An Active Simulation'
              icon='merge_type'>
              {
                this.props.activeSimulationIds.map((simulationId, index) => (
                  <DrawerItem
                    key={simulationId}
                    onClick={() => this.props.onJoinActiveSimulation(simulationId)}>
                    {`${index + 1}. ${simulationId}`}
                  </DrawerItem>
                ))
              }
            </DrawerItemGroup>
          }
          <Restricted roles={['testmanager']}>
            <DrawerItem onClick={() => this.props.onShowSimulationConfigForm(null)}>
              <DrawerItemIcon icon='assignment' />
              <DrawerItemLabel value='Configure New Simulation' />
            </DrawerItem>
          </Restricted>
          <DrawerItemGroup
            header='Select Comparison Type'
            icon='compare_arrows'>
            <DrawerItem onClick={() => this.props.onSelectExpectedResultComparisonType(ExpectedResultComparisonType.SIMULATION_VS_EXPECTED)}>
              1. {ExpectedResultComparisonType.SIMULATION_VS_EXPECTED}
            </DrawerItem>
            <DrawerItem onClick={() => this.props.onSelectExpectedResultComparisonType(ExpectedResultComparisonType.SIMULATION_VS_TIME_SERIES)}>
              2. {ExpectedResultComparisonType.SIMULATION_VS_TIME_SERIES}
            </DrawerItem>
            <DrawerItem onClick={() => this.props.onSelectExpectedResultComparisonType(ExpectedResultComparisonType.EXPECTED_VS_TIME_SERIES)}>
              3. {ExpectedResultComparisonType.EXPECTED_VS_TIME_SERIES}
            </DrawerItem>
            <DrawerItem onClick={() => this.props.onSelectExpectedResultComparisonType(ExpectedResultComparisonType.TIME_SERIES_VS_TIME_SERIES)}>
              4. {ExpectedResultComparisonType.TIME_SERIES_VS_TIME_SERIES}
            </DrawerItem>
          </DrawerItemGroup>
          {
            this.props.previousSimulations.length > 0
            &&
            <DrawerItemGroup
              header='Previous simulations'
              icon='memory'>
              {
                this.props.previousSimulations.map(simulation => (
                  <DrawerItem
                    key={simulation.id}
                    onClick={() => this.props.onShowSimulationConfigForm(simulation.config)}>
                    <strong>Name:&nbsp;</strong>
                    {simulation.name}
                    &nbsp;&mdash;&nbsp;
                    <strong>ID:&nbsp;</strong>
                    {simulation.id}
                  </DrawerItem>
                ))
              }
            </DrawerItemGroup>
          }
          <DrawerItem>
            <Link to='/applications-and-services'>
              <DrawerItemIcon icon='storage' />
              <DrawerItemLabel value='Applications & Services' />
            </Link>
          </DrawerItem>
          <DrawerItem>
            <Link to='/browse'>
              <DrawerItemIcon icon='search' />
              <DrawerItemLabel value='Browse Data' />
            </Link>
          </DrawerItem>
          <DrawerItem>
            <Link to='/stomp-client'>
              <DrawerItemIcon icon='laptop' />
              <DrawerItemLabel value='Stomp Client' />
            </Link>
          </DrawerItem>
          <DrawerItem onClick={this.props.onLogout}>
            <DrawerItemIcon icon='power_settings_new' />
            <DrawerItemLabel value='Log Out' />
          </DrawerItem>
        </Drawer>
      </>
    );
  }

  openDrawer() {
    this.drawerRef.current.open();
  }

}
