import { SimulationConfig } from "./SimulationConfig";

export interface Simulation {
  name: string;
  config: SimulationConfig;
  id: string;
}