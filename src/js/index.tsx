import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { rootReducer } from './rootReducer';
import { Action } from './models/Action';
import { MainContainer } from './views/main/MainContainer';

import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../css/index.scss';
import '../global.styles.scss';

const store = createStore(rootReducer, applyMiddleware(thunk, toPlainObject));
ReactDOM.render(
  <Provider store={store}>
    <MainContainer />
  </Provider>,
  document.querySelector('main')
);

function toPlainObject() {
  return next => action => {
    if (action instanceof Action)
      return next({ ...action });
    return next(action);
  }
}