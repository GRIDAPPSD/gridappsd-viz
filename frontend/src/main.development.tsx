import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { AppContainer as OriginalAppContainer } from './app/AppContainer';

const AppContainer = hot(OriginalAppContainer);

ReactDOM.render(
  <BrowserRouter>
    <AppContainer />
  </BrowserRouter>,
  document.querySelector('main')
);
