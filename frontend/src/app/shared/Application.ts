/* eslint-disable camelcase */
export interface Application {
  id: string;
  description: string;
  creator: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputs: any[];
  options: string[];
  execution_path: string;
  type: string;
  launch_on_startup: boolean;
  prereqs: string[];
  multiple_instances: boolean;
}
