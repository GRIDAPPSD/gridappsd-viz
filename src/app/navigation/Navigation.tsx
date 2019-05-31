import * as React from 'react';
import { Link } from 'react-router-dom';
import { Subscription } from 'rxjs';

import { ToolBar } from './app-bar/AppBar';
import { Drawer } from './drawer/Drawer';
import { DrawerOpener } from './drawer/DrawerOpener';
import { DrawerItem, DrawerItemIcon, DrawerItemLabel } from './drawer/DrawerItem';
import { DrawerItemGroup } from './drawer/DrawerItemGroup';
import { RUN_CONFIG } from '../../../runConfig';
import { SimulationConfiguration, Simulation, SimulationQueue } from '@shared/simulation';
import { StompClientService, StompClientConnectionStatus } from '@shared/StompClientService';
import { IconButton } from '@shared/buttons';


import './Navigation.scss';

interface Props {
  onShowSimulationConfigForm: (config: SimulationConfiguration) => void;
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
        <ToolBar>
          <DrawerOpener onClick={() => this._drawer.open()} />
          <Link className='navigation__app-title' to='/'>GridAPPS-D</Link>
          <span>{RUN_CONFIG.version}</span>
          {
            this.state.websocketStatus === 'CONNECTED'
            &&
            <IconButton
              style='default'
              icon='check_circle'
              className='websocket-status-indicator'
              label='Connection active' />
          }
        </ToolBar>
        <Drawer ref={ref => this._drawer = ref}>
          <DrawerItem onClick={() => this.props.onShowSimulationConfigForm(null)}>
            <DrawerItemIcon icon='assignment' />
            <DrawerItemLabel value='Simulations' />
          </DrawerItem>
          {
            this.state.previousSimulations.length > 0 &&
            <DrawerItemGroup header='Previous simulations'>
              {
                this.state.previousSimulations.map(simulation => (
                  <DrawerItem key={simulation.name} onClick={() => this.props.onShowSimulationConfigForm(simulation.config)}>
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

  private _subscribeToAllSimulationsQueueSteam(): Subscription {
    return this._simulationQueue.queueChanges()
      .subscribe(simulations => this.setState({ previousSimulations: simulations }));
  }
}