import { combineReducers } from 'redux';

import { activeSimulationConfig } from './activeSimulationConfig';
import { previousSimulations } from './previousSimulations';

export const rootReducer = combineReducers({
  activeSimulationConfig,
  previousSimulations
});