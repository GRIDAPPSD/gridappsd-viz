// views/ieee8500
import { RequestConfig } from '../../models/RequestConfig';

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
  RequestConfigActions
} from './actions';

export function requestConfig(config: RequestConfig = DEFAULT_REQUEST_CONFIG, action: RequestConfigActions): RequestConfig {
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
    default:
      return config;
  }
}

function withNewPowerSystemConfig(config: RequestConfig, prop: string, value: any): RequestConfig {
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
function withNewSimulationConfig(config: RequestConfig, prop: string, value: any): RequestConfig {
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
function withNewApplicationConfig(config: RequestConfig, prop: string, value: any): RequestConfig {
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

export const DEFAULT_REQUEST_CONFIG: RequestConfig = {
  "power_system_config": {
    "GeographicalRegion_name": "ieee8500nodecktassets_Region",
    "SubGeographicalRegion_name": "ieee8500nodecktassets_SubRegion",
    "Line_name": "ieee8500"
  },
  "simulation_config": {
    "start_time": "2009-07-21 00:00:00",
    "duration": "120",
    "simulator": "GridLAB-D",
    "timestep_frequency": "1000",
    "timestep_increment": "1000",
    "simulation_name": "ieee8500",
    "power_flow_solver_method": "NR",
    "simulation_output": {
      "output_objects": [{
        "name": "rcon_FEEDER_REG",
        "properties": ["connect_type", "Control", "control_level", "PT_phase", "band_center", "band_width", "dwell_time", "raise_taps", "lower_taps", "regulation"]
      }, {
        "name": "rcon_VREG2",
        "properties": ["connect_type", "Control", "control_level", "PT_phase", "band_center", "band_width", "dwell_time", "raise_taps", "lower_taps", "regulation"]
      }, {
        "name": "rcon_VREG3",
        "properties": ["connect_type", "Control", "control_level", "PT_phase", "band_center", "band_width", "dwell_time", "raise_taps", "lower_taps", "regulation"]
      }, {
        "name": "rcon_VREG4",
        "properties": ["connect_type", "Control", "control_level", "PT_phase", "band_center", "band_width", "dwell_time", "raise_taps", "lower_taps", "regulation"]
      }, {
        "name": "reg_FEEDER_REG",
        "properties": ["configuration", "phases", "to", "tap_A", "tap_B", "tap_C"]
      }, {
        "name": "reg_VREG2",
        "properties": ["configuration", "phases", "to", "tap_A", "tap_B", "tap_C"]
      }, {
        "name": "reg_VREG3",
        "properties": ["configuration", "phases", "to", "tap_A", "tap_B", "tap_C"]
      }, {
        "name": "reg_VREG4",
        "properties": ["configuration", "phases", "to", "tap_A", "tap_B", "tap_C"]
      }, {
        "name": "cap_capbank0a",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_A", "dwell_time", "switchA"]
      }, {
        "name": "cap_capbank1a",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_A", "dwell_time", "switchA"]
      }, {
        "name": "cap_capbank2a",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_A", "dwell_time", "switchA"]
      }, {
        "name": "cap_capbank0b",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_B", "dwell_time", "switchB"]
      }, {
        "name": "cap_capbank1b",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_B", "dwell_time", "switchB"]
      }, {
        "name": "cap_capbank2b",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_B", "dwell_time", "switchB"]
      }, {
        "name": "cap_capbank0c",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_C", "dwell_time", "switchC"]
      }, {
        "name": "cap_capbank1c",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_C", "dwell_time", "switchC"]
      }, {
        "name": "cap_capbank2c",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_C", "dwell_time", "switchC"]
      }, {
        "name": "cap_capbank3",
        "properties": ["phases", "pt_phase", "phases_connected", "control", "control_level", "capacitor_A", "capacitor_B", "capacitor_C", "dwell_time", "switchA", "switchB", "switchC"]
      }, {
        "name": "xf_hvmv_sub",
        "properties": ["power_in_A", "power_in_B", "power_in_C"]
      }, {
        "name": "nd_l2955047",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }, {
        "name": "nd_l2673313",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }, {
        "name": "nd_l3160107",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }, {
        "name": "nd_l2876814",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }, {
        "name": "nd_l3254238",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }, {
        "name": "nd_m1047574",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }, {
        "name": "nd__hvmv_sub_lsb",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }, {
        "name": "nd_190-8593",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }, {
        "name": "nd_190-8581",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }, {
        "name": "nd_190-7361",
        "properties": ["voltage_A", "voltage_B", "voltage_C"]
      }]
    },
    "model_creation_config": {
      "load_scaling_factor": "1",
      "schedule_name": "ieeezipload",
      "z_fraction": "0",
      "i_fraction": "1",
      "p_fraction": "0"
    }
  },
  "application_config": {
    "applications": [
      {
        "name": "vvo", "config_string": "{\"static_inputs\": {\"ieee8500\" : {\"control_method\": \"ACTIVE\", \"capacitor_delay\": 60, \"regulator_delay\": 60, \"desired_pf\": 0.99, \"d_max\": 0.9, \"d_min\": 0.1,\"substation_link\": \"xf_hvmv_sub\",\"regulator_list\": [\"reg_FEEDER_REG\", \"reg_VREG2\", \"reg_VREG3\", \"reg_VREG4\"],\"regulator_configuration_list\": [\"rcon_FEEDER_REG\", \"rcon_VREG2\", \"rcon_VREG3\", \"rcon_VREG4\"],\"capacitor_list\": [\"cap_capbank0a\",\"cap_capbank0b\", \"cap_capbank0c\", \"cap_capbank1a\", \"cap_capbank1b\", \"cap_capbank1c\", \"cap_capbank2a\", \"cap_capbank2b\", \"cap_capbank2c\", \"cap_capbank3\"], \"voltage_measurements\": [\"nd_l2955047,1\", \"nd_l3160107,1\", \"nd_l2673313,2\", \"nd_l2876814,2\", \"nd_m1047574,3\", \"nd_l3254238,4\"],       \"maximum_voltages\": 7500, \"minimum_voltages\": 6500,\"max_vdrop\": 5200,\"high_load_deadband\": 100,\"desired_voltages\": 7000,   \"low_load_deadband\": 100,\"pf_phase\": \"ABC\"}}}"
      },
      {
        name: 'sample_app',
        config_string: '{}'
      }
    ]

  }
};