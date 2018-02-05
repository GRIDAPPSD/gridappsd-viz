import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

// import { Action } from './models/Action';

import { rootReducer } from './root-reducer';
import { MainView } from './views/MainView';

import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../css/index.scss';
import '../assets/global.styles.scss';
import { Action } from './models/Action';

const store = createStore(rootReducer, applyMiddleware(thunk, toPlainObject));
ReactDOM.render(
  <Provider store={store}>
    <MainView />
  </Provider>,
  document.getElementById('example')
);

function toPlainObject() {
  return next => action => {
    if (action instanceof Action)
      return next({ ...action });
    return next(action);
  }
}