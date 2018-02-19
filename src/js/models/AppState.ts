import { SimulationConfig } from "./SimulationConfig";
import { Simulation } from "./Simulation";

export interface AppState {
  activeSimulationConfig: SimulationConfig;
  previousSimulations: Simulation[];
}