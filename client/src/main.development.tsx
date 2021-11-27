import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { AppContainer as OriginalAppContainer } from './app/AppContainer';

import './global-styles.light.scss';
import './global-styles.dark.scss';

const AppContainer = hot(OriginalAppContainer);

ReactDOM.render(
  <BrowserRouter>
    <AppContainer />
  </BrowserRouter>,
  document.querySelector('main')
);
