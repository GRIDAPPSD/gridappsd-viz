import * as React from 'react';

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
// import { DrawerItemGroup } from './drawer/DrawerItemGroup';
import { RequestConfigForm } from './ieee8500/RequestConfigForm';
import { RequestConfig } from '../models/RequestConfig';

export interface MainViewProps { }
export interface MainViewState {
}


let dataSource = DataSource.RabinalWebsocket;
if (window.location.href.indexOf('?poll') >= 0) {
  dataSource = DataSource.PollingNode;
}

let mainController = new MainController(dataSource);

export class MainView extends React.Component<MainViewProps, MainViewState> {

  private _drawer: Drawer = null;

  constructor(props: any) {
    super(props);
    this.state = {
    };
    this._closeDrawer = this._closeDrawer.bind(this);
    this._openDrawer = this._openDrawer.bind(this);
    this._requestConfigFormSubmitted = this._requestConfigFormSubmitted.bind(this);
  }

  render() {
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
                <Route exact path='/edit-request-config' component={() => <RequestConfigForm show={true} onSubmit={this._requestConfigFormSubmitted} />}/>
                <Route exact path="/ieee8500" component={() => <Ieee8500View controller={mainController.ieee8500Controller} />} />
                <Route exact path="/titanium" component={() => <Ieee8500View controller={mainController.ieee8500Controller} />} />
                <Route exact path="/help" component={Help} />
                <Route exact path="/applications" component={Applications} />
              </div>
            }>
            <DrawerItem>
              <Link to='/edit-request-config'>Simulations</Link>
            </DrawerItem>
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

  private _requestConfigFormSubmitted(requestConfig: RequestConfig) {
    console.log('Updated request config object:', requestConfig);
    mainController.ieee8500Controller.setSimulationRequest(requestConfig);
  }

}