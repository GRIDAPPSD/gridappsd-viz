/* eslint-disable camelcase */
import { FieldModelConfiguration } from '@client:common/field-model-datastream';

export const DEFAULT_FIELD_MODEL_CONFIGURATION: FieldModelConfiguration = {
  power_system_config: {
    GeographicalRegion_name: '_73C512BD-7249-4F50-50DA-D93849B89C43', // IEEE
    SubGeographicalRegion_name: '_A1170111-942A-6ABD-D325-C64886DC4D7D', // Large
    // Line_name: '_49AD8E07-3BF9-A4E2-CB8F-C3722F837B62' // ieee13nodeckt
    Line_name: '_C1C3E687-6FFD-C753-582B-632A27E28507' // 123
    // Line_name: ''
  },
  simulation_config: {
    start_time: '2022-11-23 00:00:00',
    duration: '12000',
    simulator: 'GridLAB-D',
    timestep_frequency: '1000',
    timestep_increment: '1000',
    run_realtime: true,
    simulation_name: '',
    power_flow_solver_method: 'NR',
    model_creation_config: {
      load_scaling_factor: '1',
      schedule_name: 'ieeezipload',
      z_fraction: '0',
      i_fraction: '1',
      p_fraction: '0',
      randomize_zipload_fractions: false,
      use_houses: false
    }
  },
  application_config: {
    applications: []
  },
  service_configs: [],
  test_config: {
    events: [],
    appId: ''
  }
};
