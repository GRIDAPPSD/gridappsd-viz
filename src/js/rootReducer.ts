import { combineReducers } from 'redux';

import { previousSimulations, activeSimulationConfig } from './views/main/main-reducers';

export const rootReducer = combineReducers({
  activeSimulationConfig,
  previousSimulations
});