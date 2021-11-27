/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
export interface SimulationConfiguration {
  power_system_config: {
    GeographicalRegion_name: string;
    SubGeographicalRegion_name: string;
    Line_name: string;
  };
  simulation_config: {
    start_time: string;
    duration: string;
    simulator: string;
    run_realtime: boolean;
    timestep_frequency: string;
    timestep_increment: string;
    simulation_name: string;
    power_flow_solver_method: string;
    model_creation_config: {
      load_scaling_factor: string;
      schedule_name: string;
      z_fraction: string;
      i_fraction: string;
      p_fraction: string;
      randomize_zipload_fractions: boolean;
      use_houses: boolean;
    };
  };
  application_config: {
    applications: Array<{ name: string; config_string: string }>;
  };
  service_configs: Array<{ id: string; user_options: any }>;
  test_config: {
    events: Array<any>;
    appId: string;
  };
}
