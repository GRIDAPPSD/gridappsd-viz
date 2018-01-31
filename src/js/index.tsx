import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Route, BrowserRouter } from 'react-router-dom';

import { Header } from './views/Header';
import { MainView } from './views/MainView';

import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../css/index.scss';
import '../assets/global.styles.scss';

ReactDOM.render(
    <MainView />,
    document.getElementById('example')
);