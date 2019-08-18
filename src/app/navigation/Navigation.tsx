import * as React from 'react';
import { Link } from 'react-router-dom';
import { Subscription } from 'rxjs';

import { SimulationConfiguration, Simulation, SimulationQueue } from '@shared/simulation';
import { StompClientService, StompClientConnectionStatus } from '@shared/StompClientService';
import { ConfigurationManager } from '@shared/ConfigurationManager';

import { Drawer } from './views/drawer/Drawer';
import { ToolBar } from './views/tool-bar/ToolBar';
import { DrawerOpener } from './views/drawer/DrawerOpener';
import { DrawerItem, DrawerItemIcon, DrawerItemLabel } from './views/drawer/DrawerItem';
import { DrawerItemGroup } from './views/drawer/DrawerItemGroup';
import { AppBranding } from './views/app-branding/AppBranding';
import { WebSocketConnectedIndicator } from './views/websocket-connected-indicator/WebSocketConnectedIndicator';

import './Navigation.scss';

interface Props {
  onShowSimulationConfigForm: (config: SimulationConfiguration) => void;
}

interface State {
  previousSimulations: Simulation[];
  websocketStatus: StompClientConnectionStatus;
  version: string;
}

export class Navigation extends React.Component<Props, State> {

  drawer: Drawer;

  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _configurationManager = ConfigurationManager.getInstance();
  private _queueChangesStream: Subscription;
  private _websocketStatusStream: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      previousSimulations: this._simulationQueue.getAllSimulations(),
      websocketStatus: this._stompClientService.isActive() ? 'CONNECTED' : 'CONNECTING',
      version: ''
    };
    this._queueChangesStream = this._subscribeToAllSimulationsQueueSteam();
    this._websocketStatusStream = this._stompClientService.statusChanges()
      .subscribe(state => this.setState({ websocketStatus: state }));

    this.openDrawer = this.openDrawer.bind(this);
  }

  componentDidMount() {
    this._configurationManager.configurationChanges()
      .subscribe({
        next: configurations => this.setState({ version: configurations.version })
      });
  }


  componentWillUnmount() {
    if (this._queueChangesStream)
      this._queueChangesStream.unsubscribe();
    if (this._websocketStatusStream)
      this._websocketStatusStream.unsubscribe();
  }

  render() {
    return (
      <>
        <ToolBar>
          <DrawerOpener onClick={this.openDrawer} />
          <AppBranding version={this.state.version} />
          <WebSocketConnectedIndicator websocketStatus={this.state.websocketStatus} />
        </ToolBar>
        <Drawer ref={ref => this.drawer = ref}>
          <DrawerItem onClick={() => this.props.onShowSimulationConfigForm(null)}>
            <DrawerItemIcon icon='assignment' />
            <DrawerItemLabel value='Simulations' />
          </DrawerItem>
          {
            this.state.previousSimulations.length > 0 &&
            <DrawerItemGroup
              header='Previous simulations'
              icon='memory'>
              {
                this.state.previousSimulations.map(simulation => (
                  <DrawerItem
                    key={simulation.name}
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
            <Link to='/applications'>
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
        </Drawer>
      </>
    );
  }

  openDrawer() {
    this.drawer.open();
  }

  private _subscribeToAllSimulationsQueueSteam(): Subscription {
    return this._simulationQueue.queueChanges()
      .subscribe(simulations => this.setState({ previousSimulations: simulations }));
  }

}
