import { SimulationConfiguration } from '@shared/simulation';

export const DEFAULT_SIMULATION_CONFIGURATION: SimulationConfiguration = {
  power_system_config: {
    GeographicalRegion_name: 'ieee8500nodecktassets_Region',
    SubGeographicalRegion_name: 'ieee8500nodecktassets_SubRegion',
    Line_name: ''
  },
  simulation_config: {
    start_time: '2009-07-21 00:00:00',
    duration: '120',
    simulator: 'GridLAB-D',
    timestep_frequency: '1000',
    timestep_increment: '1000',
    run_realtime: true,
    simulation_name: 'ieee8500',
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
  test_config: {
    events: [],
    appId: ''
  }
};
