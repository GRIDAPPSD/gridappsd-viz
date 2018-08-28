import * as React from 'react';
import { Link } from 'react-router-dom';

import { AppBar } from './views/app-bar/AppBar';
import { Drawer } from './views/drawer/Drawer';
import { DrawerOpener } from './views/drawer/DrawerOpener';
import { DrawerItem, DrawerItemIcon, DrawerItemLabel } from './views/drawer/DrawerItem';
import { DrawerItemGroup } from './views/drawer/DrawerItemGroup';
import { RUN_CONFIG } from '../../../runConfig';
import { SimulationConfig } from '../models/SimulationConfig';

import './Navigation.scss';
import { DEFAULT_SIMULATION_CONFIG } from '../models/default-simulation-config';
import { SimulationQueue } from '../services/SimulationQueue';

interface Props {
  onShowSimulationConfigForm: (config: SimulationConfig) => void;
}

interface State {
  drawerOpened: boolean;
}

export class Navigation extends React.Component<Props, State> {

  private readonly _simulationQueue = SimulationQueue.getInstance();
  private _drawer: Drawer;

  constructor(props: any) {
    super(props);
    this.state = {
      drawerOpened: false
    };
  }

  render() {
    const previousSimulations = this._simulationQueue.getAllSimulations();

    return (
      <>
        <AppBar>
          <DrawerOpener onClick={() => this._drawer.open()} />
          <Link className='navigation__app-title' to='/'>GridAPPS-D</Link>
          <span>{RUN_CONFIG.version}</span>
        </AppBar>
        <Drawer ref={ref => this._drawer = ref}>
          <DrawerItem onClick={() => this.props.onShowSimulationConfigForm(DEFAULT_SIMULATION_CONFIG)}>
            <DrawerItemIcon iconClassName='edit-simulation-config-icon' />
            <DrawerItemLabel value='Simulations' />
          </DrawerItem>
          {
            previousSimulations.length > 0 &&
            <DrawerItemGroup header='Previous simulations'>
              {
                previousSimulations.map(simulation => (
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
              <DrawerItemIcon iconClassName='show-application-and-services-icon' />
              <DrawerItemLabel value='Applications & Services' />
            </Link>
          </DrawerItem>
          <DrawerItem>
            <Link to='/browse'>
              <DrawerItemIcon iconClassName='browse-database-icon' />
              <DrawerItemLabel value='Browse Database' />
            </Link>
          </DrawerItem>
          <DrawerItem>
            <Link to='/stomp-client'>
              <DrawerItemIcon iconClassName='stomp-client-icon' />
              <DrawerItemLabel value='Stomp Client' />
            </Link>
          </DrawerItem>
        </Drawer>
      </>
    );
  }

}