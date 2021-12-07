/* eslint-disable camelcase */
export interface Service {
  id: string;
  description: string;
  creator: string;
  static_args: string[];
  execution_path: string;
  type: string;
  launch_on_startup: boolean;
  multiple_instances: boolean;
  environmentVariables: Array<{ envName: string; envValue: string }>;
  input_topics?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output_topics?: any[];
  service_dependencies?: string[];
  user_input: {
    [inputName: string]: ServiceConfigUserInputSpec;
  };
  category: string;
}

export interface ServiceConfigUserInputSpec {
  help: string;
  help_example: string;
  type: 'float' | 'int' | 'object' | 'bool';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default_value: any;
  min_value?: number;
  max_value?: number;
}
