import { SimulationOutputMeasurement } from './SimulationOutputMeasurement';

export interface SimulationOutput {
  simulationId: string;
  timestamp: number;
  measurements: SimulationOutputMeasurement[];

}