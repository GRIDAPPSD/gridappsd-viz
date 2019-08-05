export interface Service {
  id: string;
  description: string;
  creator: string;
  static_args: string[];
  execution_path: string;
  type: string;
  launch_on_startup: boolean;
  multiple_instances: boolean;
  environmentVariables: EnvironmentVariable[];
  input_topics?: string[];
  output_topics?: any[];
  service_dependencies?: string[];
}

export interface EnvironmentVariable {
  envName: string;
  envValue: string;
}
