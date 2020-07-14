/* eslint-disable camelcase */
export interface SimulationConfigurationTabModel {
  start_time: string;
  duration: string;
  simulator: string;
  run_realtime: boolean;
  simulation_name: string;
  model_creation_config: {
    load_scaling_factor: string;
    schedule_name: string;
    z_fraction: string;
    i_fraction: string;
    p_fraction: string;
    randomize_zipload_fractions: boolean;
    use_houses: boolean;
  };
}
