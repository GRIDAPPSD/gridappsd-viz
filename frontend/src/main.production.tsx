import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { AppContainer } from './app/AppContainer';

ReactDOM.render(
  <BrowserRouter>
    <AppContainer />
  </BrowserRouter>,
  document.querySelector('main')
);
