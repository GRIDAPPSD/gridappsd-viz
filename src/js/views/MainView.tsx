import * as React from 'react';

import { Header } from './Header';
import { Route, BrowserRouter, Link } from 'react-router-dom';

import Ieee8500View from '../views/ieee8500/Ieee8500View';
import MainController from '../controllers/MainController';
import DataSource from '../interfaces/DataSource';
import { Help } from '../views/Help';

import '../../css/MainView.scss';
import { AppBar } from './app-bar/AppBar';
import { DrawerOpener } from './drawer/DrawerOpener';
import { Drawer } from './drawer/Drawer';
import { DrawerItem } from './drawer/DrawerItem';
import { DrawerItemGroup } from './drawer/DrawerItemGroup';
import { RequestConfigForm } from './ieee8500/RequestConfigForm';

export interface MainViewProps { }
export interface MainViewState {
  showRequestConfigForm: boolean;
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
      showRequestConfigForm: false
    };
    this._openDrawer = this._openDrawer.bind(this);
    this._showRequestConfigForm = this._showRequestConfigForm.bind(this);
    this._hideRequestConfigForm = this._hideRequestConfigForm.bind(this);
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
            ref={comp => this._drawer = comp}
            content={
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <RequestConfigForm show={this.state.showRequestConfigForm} onDone={this._hideRequestConfigForm}/>
                <Route exact path="/ieee8500" component={() => <Ieee8500View controller={mainController.ieee8500Controller} />} />
                <Route exact path="/titanium" component={() => <Ieee8500View controller={mainController.ieee8500Controller} />} />
                <Route exact path="/help" component={Help} />
              </div>
            }>
            <DrawerItem onClick={this._showRequestConfigForm}>
              {/* <Link to='/ieee8500'>IEEE 8500</Link> */}
              <span>IEEE 8500</span>
            </DrawerItem>
            <DrawerItemGroup header='Applications'>
              <DrawerItem>
                <Link className='' to='/'>VIVO</Link>
              </DrawerItem>
            </DrawerItemGroup>
          </Drawer>
        </main>
      </BrowserRouter>
    );
  }
  private _showRequestConfigForm() {
    this.setState({ showRequestConfigForm: true });
  }
  private _hideRequestConfigForm() {
    this.setState({ showRequestConfigForm: false });
  }
  private _openDrawer() {
    this._drawer.toggleDrawer();
  }
}