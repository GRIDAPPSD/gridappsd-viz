import * as React from 'react';
import { Route, BrowserRouter, Link } from 'react-router-dom';

import { RUN_CONFIG } from '../../../../runConfig';

import { Help } from '../Help';
import { ApplicationsView } from '../ApplicationsView';


import { AppBar } from '../app-bar/AppBar';
import { DrawerOpener } from '../drawer/DrawerOpener';
import { Drawer } from '../drawer/Drawer';
import { DrawerItem } from '../drawer/DrawerItem';
import { DrawerItemGroup } from '../drawer/DrawerItemGroup';
import { SimulationConfigForm } from '../topology/SimulationConfigForm';
import { SimulationConfig } from '../../models/SimulationConfig';
import { Simulation } from '../../models/Simulation';
import { TopologyModelRendererContainer } from '../topology/TopologyModelRendererContainer';
import { SimulationStatusLoggerContainer } from '../simulation-status-logger/SimulationStatusLoggerContainer';

import './Main.styles.scss';

interface Props {
  previousSimulations: Simulation[];
  onPreviousSimulationSelected: (simulation: Simulation) => void;
  onSimulationConfigFormSubmitted: (simulationConfig: SimulationConfig) => void;
}

interface State {
  showSimulationConfigForm: boolean;
}

export class Main extends React.Component<Props, State> {
  private _drawer: Drawer = null;

  constructor(props: any) {
    super(props);
    this.state = {
      showSimulationConfigForm: false
    };
  }
  render() {
    return (
      <BrowserRouter>
        <>
          <AppBar>
            <DrawerOpener onClick={() => this._drawer.open()} />
            <Link className='app-title' to='/'>GridAPPS-D</Link>
            <span>{RUN_CONFIG.version}</span>
          </AppBar>
          <Drawer
            ref={drawer => this._drawer = drawer}>
            <DrawerItem onClick={() => this.setState({ showSimulationConfigForm: true })}>
              Simulations
            </DrawerItem>
            {
              this.props.previousSimulations.length > 0 &&
              <DrawerItemGroup className='previous-simulations' header='Previous Simulations'>
                {
                  this.props.previousSimulations.map((simulation: Simulation, index) => {
                    return (
                      <DrawerItem
                        key={index}
                        className='simulation'
                        onClick={() => {
                          this.props.onPreviousSimulationSelected(simulation);
                          // If the form is currently showing,
                          // Selecting a different existing simulation won't trigger rerender
                          // so do this
                          this.setState({ showSimulationConfigForm: false });
                          setTimeout(() => this.setState({ showSimulationConfigForm: true }), 100);
                        }}>
                        <span className='simulation-name'>{simulation.name}</span>
                        <span className='simulation-id'>{simulation.id}</span>
                      </DrawerItem>
                    );
                  })
                }
              </DrawerItemGroup>
            }
            <DrawerItem >
              <Link to='/applications'>Applications & Services</Link>
            </DrawerItem>
            <DrawerItem >
              <Link to='/browse'>Browse Database</Link>
            </DrawerItem>
          </Drawer>
          <Route
            exact
            path='/topology'
            component={match =>
              <section className='content'>
                <section className='left'>
                  <TopologyModelRendererContainer match={match} />
                  <SimulationStatusLoggerContainer />
                </section>
                <section className='right'>
                  <div className='placehodler'></div>
                </section>
              </section>
            } />
          <Route exact path='/help' component={Help} />
          <Route exact path='/applications' component={ApplicationsView} />
       
          <SimulationConfigForm show={this.state.showSimulationConfigForm} onSubmit={(simulationConfig: SimulationConfig) => {
            this.setState({ showSimulationConfigForm: false });
            this.props.onSimulationConfigFormSubmitted(simulationConfig);
          }} />
        </>
      </BrowserRouter>
    );
  }
}