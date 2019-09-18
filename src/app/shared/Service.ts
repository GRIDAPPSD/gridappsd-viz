export interface Service {
  id: string;
  description: string;
  creator: string;
  static_args: string[];
  execution_path: string;
  type: string;
  launch_on_startup: boolean;
  multiple_instances: boolean;
  environmentVariables: Array<{ envName: string; envValue: string; }>;
  input_topics?: string[];
  output_topics?: any[];
  service_dependencies?: string[];
  user_input: {
    [inputName: string]: ServiceConfigUserInputSpec
  };
}

export interface ServiceConfigUserInputSpec {
  help: string;
  help_example: string;
  type: 'float' | 'object' | 'bool';
  default_value: any;
  min_value?: number;
  max_value?: number;
}
