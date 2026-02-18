/* eslint-disable camelcase */
export interface SimulationConfigurationTabModel {
   start_time: string;
   duration: string;
   simulator: string;
   run_realtime: boolean;
   simulation_name: string;
   model_creation_config: {
      encoding: string;
      i_fraction: string;
      load_scaling_factor: string;
      p_fraction: string;
      power_unit_conversion: string;
      randomize_zipload_fractions: boolean;
      schedule_name: string;
      system_frequency: string;
      triplex: string;
      unique_names: string;
      use_houses: boolean;
      voltage_multiplier: string;
      z_fraction: string;
   };
}
