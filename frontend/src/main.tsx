import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import './global-styles.light.scss';
import './global-styles.dark.scss';

import { AppContainer } from './app/AppContainer';


ReactDOM.render(
  <BrowserRouter>
    <AppContainer />
  </BrowserRouter>,
  document.querySelector('main')
);
