import { SimulationConfiguration } from './SimulationConfiguration';

export interface Simulation {
  name: string;
  config: SimulationConfiguration;
  id: string;
}