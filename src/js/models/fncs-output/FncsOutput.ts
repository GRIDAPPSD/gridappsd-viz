import { FncsOutputMeasurement } from './FncsOutputMeasurement';

export interface FncsOutput {
  simulationId: string;
  command: string;
  timestamp: string;
  measurements: FncsOutputMeasurement[];
  
}