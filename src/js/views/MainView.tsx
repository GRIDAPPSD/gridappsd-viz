import * as React from 'react';
import { connect } from 'react-redux';

import { Route, BrowserRouter, Link } from 'react-router-dom';

import Ieee8500View from '../views/ieee8500/Ieee8500View';
import MainController from '../controllers/MainController';
import DataSource from '../interfaces/DataSource';
import { Help } from '../views/Help';
import { Applications } from '../views/ApplicationsView';

import '../../css/MainView.scss';
import { AppBar } from './app-bar/AppBar';
import { DrawerOpener } from './drawer/DrawerOpener';
import { Drawer } from './drawer/Drawer';
import { DrawerItem } from './drawer/DrawerItem';
import { DrawerItemGroup } from './drawer/DrawerItemGroup';
import { SimulationConfigForm } from './ieee8500/SimulationConfigForm';
import { SimulationConfig } from '../models/SimulationConfig';
import { AppState } from '../models/AppState';
import { Simulation } from '../models/Simulation';
import { AddSimulation, SetActiveSimulationConfig } from '../actions/simulation-actions';

export interface MainViewProps {
  dispatch: any;
  previousSimulations: Simulation[];
}
export interface MainViewState {
  showSimulationConfigForm: boolean;
}


let dataSource = DataSource.RabinalWebsocket;
if (window.location.href.indexOf('?poll') >= 0) {
  dataSource = DataSource.PollingNode;
}

let mainController = new MainController(dataSource);

class MainViewContainer extends React.Component<MainViewProps, MainViewState> {

  private _drawer: Drawer = null;

  constructor(props: any) {
    super(props);
    this.state = {
      showSimulationConfigForm: false
    };
    this._closeDrawer = this._closeDrawer.bind(this);
    this._openDrawer = this._openDrawer.bind(this);
    this._simulationConfigFormSubmitted = this._simulationConfigFormSubmitted.bind(this);
  }

  render() {
    const { previousSimulations, dispatch } = this.props;
    return (
      <BrowserRouter>
        <main>
          <AppBar>
            <DrawerOpener onClick={this._openDrawer} />
            <Link className="app-title" to="/">GridAPPS-D</Link>
          </AppBar>
          <Drawer
            ref={drawer => this._drawer = drawer}
            content={
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <SimulationConfigForm show={this.state.showSimulationConfigForm} onSubmit={this._simulationConfigFormSubmitted} />
                <Route exact path="/ieee8500" component={() => <Ieee8500View controller={mainController.ieee8500Controller} />} />
                <Route exact path="/titanium" component={() => <Ieee8500View controller={mainController.ieee8500Controller} />} />
                <Route exact path="/help" component={Help} />
                <Route exact path="/applications" component={Applications} />
              </div>
            }>
            <DrawerItem onClick={() => this.setState({ showSimulationConfigForm: true })}>
              Simulations
            </DrawerItem>
            {
              previousSimulations.length > 0 &&
              <DrawerItemGroup className='previous-simulations' header='Previous Simulations'>
                {
                  previousSimulations.map((simulation: Simulation, index) => {
                    return (
                      <DrawerItem
                        key={index}
                        className='simulation'
                        onClick={() => {
                          dispatch(new SetActiveSimulationConfig(simulation.config));
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
              <Link to="/applications">Applications & Services </Link>
            </DrawerItem>
          </Drawer>
        </main>
      </BrowserRouter>
    );
  }

  private _closeDrawer() {
    this._drawer.close();
  }

  private _openDrawer() {
    this._drawer.open();
  }

  private _simulationConfigFormSubmitted(simulationConfig: SimulationConfig) {
    this.setState({ showSimulationConfigForm: false });
    console.log('Updated simulation config object:', simulationConfig);
    mainController.ieee8500Controller.setSimulationRequest(simulationConfig);
    this.props.dispatch(new AddSimulation({
      name: simulationConfig.simulation_config.simulation_name,
      config: simulationConfig,
      id: simulationConfig.simulation_config.simulation_name
    }));
  }

}

const mapStateToProps = (state: AppState) => ({
  previousSimulations: state.previousSimulations
});

export const MainView = connect(mapStateToProps)(MainViewContainer);