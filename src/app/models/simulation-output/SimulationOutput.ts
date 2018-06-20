import { SimulationOutputMeasurement } from './SimulationOutputMeasurement';

export interface SimulationOutput {
  simulationId: string;
  command: string;
  timestamp: string;
  measurements: SimulationOutputMeasurement[];
  
}