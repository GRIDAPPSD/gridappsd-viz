// views/ieee8500
import { SimulationConfig } from '../models/SimulationConfig';

import {
  SET_GEOGRAPHICAL_REGION_NAME,
  SET_SUBGEOGRAPHICAL_REGION_NAME,
  SET_LINE_NAME,
  SET_DURATION,
  SET_SIMULATOR,
  SET_TIMESTEP_FREQUENCY,
  SET_TIMESTEP_INCREMENT,
  SET_SIMULATION_NAME,
  SET_POWER_FLOW_SOLVER_METHOD,
  UPDATE_APPLICATION_CONFIGURATION,
  SET_OUTPUT_OBJECTS,
  SimulationConfigActions
} from '../actions/simulation-config-actions';
import { DEFAULT_SIMULATION_CONFIG } from '../models/default-simulation-config';
import { SET_ACTIVE_SIMULATION_CONFIG, SetActiveSimulationConfig } from '../actions/simulation-actions';

export function activeSimulationConfig(config: SimulationConfig = DEFAULT_SIMULATION_CONFIG, action: SimulationConfigActions | SetActiveSimulationConfig): SimulationConfig {
  switch (action.type) {
    case SET_GEOGRAPHICAL_REGION_NAME:
      return withNewPowerSystemConfig(config, 'GeographicalRegion_name', action.value);
    case SET_SUBGEOGRAPHICAL_REGION_NAME:
      return withNewPowerSystemConfig(config, 'SubGeographicalRegion_name', action.value);
    case SET_LINE_NAME:
      return withNewPowerSystemConfig(config, 'Line_name', action.value);
    case SET_DURATION:
      return withNewSimulationConfig(config, 'duration', action.value);
    case SET_SIMULATOR:
      return withNewSimulationConfig(config, 'simulator', action.value);
    case SET_TIMESTEP_FREQUENCY:
      return withNewSimulationConfig(config, 'timestep_frequency', action.value);
    case SET_TIMESTEP_INCREMENT:
      return withNewSimulationConfig(config, 'timestep_increment', action.value);
    case SET_SIMULATION_NAME:
      return withNewSimulationConfig(config, 'simulation_name', action.value);
    case SET_POWER_FLOW_SOLVER_METHOD:
      return withNewSimulationConfig(config, 'power_flow_solver_method', action.value);
    case SET_OUTPUT_OBJECTS:
      return withNewSimulationConfig(config, 'simulation_output', { output_objects: action.outputObjects });
    case UPDATE_APPLICATION_CONFIGURATION:
      return withNewApplicationConfig(config, 'applications', [{ name: action.appName, config_string: action.configStr }]);
    case SET_ACTIVE_SIMULATION_CONFIG:
      return action.config;
    default:
      return config;
  }
}

function withNewPowerSystemConfig(config: SimulationConfig, prop: string, value: any): SimulationConfig {
  if (prop in config.power_system_config)
    return {
      ...config,
      power_system_config: {
        ...config.power_system_config,
        [prop]: value
      }
    };
  else
    throw new Error(`Unknown property [${prop}] inside [config.power_system_config]`);
}
function withNewSimulationConfig(config: SimulationConfig, prop: string, value: any): SimulationConfig {
  if (prop in config.simulation_config)
    return {
      ...config,
      simulation_config: {
        ...config.simulation_config,
        [prop]: value
      }
    };
  else
    throw new Error(`Unknown property [${prop}] inside [config.simulation_output]`);
}
function withNewApplicationConfig(config: SimulationConfig, prop: string, value: any): SimulationConfig {
  if (prop in config.application_config)
    return {
      ...config,
      application_config: {
        ...config.application_config,
        [prop]: value
      }
    };
  else
    throw new Error(`Unknown property [${prop}] inside [config.application_config]`);
}