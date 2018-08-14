import { SimulationOutputMeasurement } from './SimulationOutputMeasurement';

export interface SimulationOutput {
  simulationId: string;
  timestamp: string;
  measurements: SimulationOutputMeasurement[];

}