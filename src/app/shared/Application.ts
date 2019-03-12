export interface Application {
  id: string;
  description: string;
  creator: string;
  inputs: any[];
  outputs: any[];
  options: string[];
  execution_path: string;
  type: string;
  launch_on_startup: boolean;
  prereqs: string[];
  multiple_instances: boolean;
}