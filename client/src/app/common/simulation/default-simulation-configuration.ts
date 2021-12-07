/* eslint-disable camelcase */
import { SimulationConfiguration } from '@client:common/simulation';

export const DEFAULT_SIMULATION_CONFIGURATION: SimulationConfiguration = {
  power_system_config: {
    GeographicalRegion_name: '_73C512BD-7249-4F50-50DA-D93849B89C43', // IEEE
    SubGeographicalRegion_name: '_A1170111-942A-6ABD-D325-C64886DC4D7D', // Large
    Line_name: ''
  },
  simulation_config: {
    start_time: '2009-07-21 00:00:00',
    duration: '120',
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
