import { OutputObject} from './OutputObject';

export interface SimulationConfig {
  power_system_config: {
    GeographicalRegion_name: string;
    SubGeographicalRegion_name: string;
    Line_name: string;
  };
  simulation_config: {
    start_time: string;
    duration: string;
    simulator: string;
    realtime: boolean;
    timestep_frequency: string;
    timestep_increment: string;
    simulation_name: string;
    power_flow_solver_method: string;
    simulation_output: {
      output_objects: OutputObject[];
    };
    model_creation_config: {
      load_scaling_factor: string;
      schedule_name: string;
      z_fraction: string;
      i_fraction: string;
      p_fraction: string;
    };
  };
  application_config: {
    applications: Array<{ name: string, config_string: string }>
  };
}