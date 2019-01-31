import * as React from 'react';
import { Link } from 'react-router-dom';
import { Subscription } from 'rxjs';

import { AppBar } from './app-bar/AppBar';
import { Drawer } from './drawer/Drawer';
import { DrawerOpener } from './drawer/DrawerOpener';
import { DrawerItem, DrawerItemIcon, DrawerItemLabel } from './drawer/DrawerItem';
import { DrawerItemGroup } from './drawer/DrawerItemGroup';
import { RUN_CONFIG } from '../../../runConfig';
import { SimulationConfig } from '../models/SimulationConfig';
import { DEFAULT_SIMULATION_CONFIG } from '../models/default-simulation-config';
import { SimulationQueue } from '../services/SimulationQueue';
import { Simulation } from '../models/Simulation';
import { StompClientService, StompClientConnectionStatus } from '../services/StompClientService';
import { IconButton } from '@shared/buttons';


import './Navigation.scss';

interface Props {
  onShowSimulationConfigForm: (config: SimulationConfig) => void;
}

interface State {
  previousSimulations: Simulation[];
  websocketStatus: StompClientConnectionStatus;
}

export class Navigation extends React.Component<Props, State> {

  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private _drawer: Drawer;
  private _queueChangesStream: Subscription;
  private _websocketStatusStream: Subscription;

  constructor(props: any) {
    super(props);
    this.state = {
      previousSimulations: this._simulationQueue.getAllSimulations(),
      websocketStatus: this._stompClientService.isActive() ? 'CONNECTED' : 'CONNECTING'
    };
    this._queueChangesStream = this._subscribeToAllSimulationsQueueSteam();
    this._websocketStatusStream = this._stompClientService.statusChanges()
      .subscribe(state => this.setState({ websocketStatus: state }));
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
        <AppBar>
          <DrawerOpener onClick={() => this._drawer.open()} />
          <Link className='navigation__app-title' to='/'>GridAPPS-D</Link>
          <span>{RUN_CONFIG.version}</span>
          {
            this.state.websocketStatus === 'CONNECTED'
            &&
            <IconButton
              icon='websocket-connection-active'
              className='websocket-status-indicator'
              label='Connection active' />
          }
        </AppBar>
        <Drawer ref={ref => this._drawer = ref}>
          <DrawerItem onClick={() => this.props.onShowSimulationConfigForm(DEFAULT_SIMULATION_CONFIG)}>
            <DrawerItemIcon icon='form' />
            <DrawerItemLabel value='Simulations' />
          </DrawerItem>
          {
            this.state.previousSimulations.length > 0 &&
            <DrawerItemGroup header='Previous simulations'>
              {
                this.state.previousSimulations.map(simulation => (
                  <DrawerItem key={simulation.id} onClick={() => this.props.onShowSimulationConfigForm(simulation.config)}>
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
              <DrawerItemIcon icon='app' />
              <DrawerItemLabel value='Applications & Services' />
            </Link>
          </DrawerItem>
          <DrawerItem>
            <Link to='/browse'>
              <DrawerItemIcon icon='browse' />
              <DrawerItemLabel value='Browse Data' />
            </Link>
          </DrawerItem>
          <DrawerItem>
            <Link to='/stomp-client'>
              <DrawerItemIcon icon='terminal' />
              <DrawerItemLabel value='Stomp Client' />
            </Link>
          </DrawerItem>
        </Drawer>
      </>
    );
  }

  private _subscribeToAllSimulationsQueueSteam(): Subscription {
    return this._simulationQueue.queueChanges()
      .subscribe(simulations => this.setState({ previousSimulations: simulations }));
  }
}