import { SimulationConfig } from './SimulationConfig';
import { Simulation } from './Simulation';
import { MRID } from './MRID';
import { SimulationOutput } from './simulation-output/SimulationOutput';

export interface AppState {
  activeSimulationConfig: SimulationConfig;
  previousSimulations: Simulation[];
  mRIDs: MRID[];
  simulationOutput: SimulationOutput;
}