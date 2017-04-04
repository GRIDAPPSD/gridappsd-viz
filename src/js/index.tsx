import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Router, Route, Link, browserHistory} from 'react-router';

import Ieee8500View from './views/ieee8500/Ieee8500View';
import MainController from './controllers/MainController';
import {Help} from './views/Help';
import {Header} from './views/Header';
import {MainView} from './views/MainView';

import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../css/index.scss';

let mainController = new MainController();

ReactDOM.render(
    <Router history={browserHistory}>
        <Route path="/" component={MainView}>
            <Route path="ieee8500" components={{content: () => <Ieee8500View controller={mainController.ieee8500Controller} />}}>
            </Route>
            <Route path="help" components={{content: Help}}>
            </Route>
        </Route>
    </Router>,
    document.getElementById('example')
);