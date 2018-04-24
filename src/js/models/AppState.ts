import { SimulationConfig } from "./SimulationConfig";
import { Simulation } from "./Simulation";
import { MRID } from "./MRID";
import { FncsOutput } from "./fncs-output/FncsOutput";

export interface AppState {
  activeSimulationConfig: SimulationConfig;
  previousSimulations: Simulation[];
  mRIDs: MRID[];
  fncsOutput: FncsOutput;
}