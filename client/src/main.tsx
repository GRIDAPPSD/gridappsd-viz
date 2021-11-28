import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { AppContainer } from './app/AppContainer';

import './global-styles.light.scss';
import './global-styles.dark.scss';

ReactDOM.render(
  <BrowserRouter>
    <AppContainer />
  </BrowserRouter>,
  document.querySelector('main')
);
