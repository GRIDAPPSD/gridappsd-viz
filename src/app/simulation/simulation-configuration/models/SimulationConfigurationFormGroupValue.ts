export interface SimulationConfigurationFormGroupValue {
  startTime: string;
  duration: string;
  simulator: string;
  runInRealtime: boolean;
  simulationName: string;
  modelCreationConfig: {
    load_scaling_factor: string;
    schedule_name: string;
    z_fraction: string;
    i_fraction: string;
    p_fraction: string;
    randomize_zipload_fractions: boolean;
    use_houses: boolean;
  };
}
