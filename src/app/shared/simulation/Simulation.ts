import { SimulationConfiguration } from './SimulationConfiguration';

export class Simulation {

  id = btoa(String(Math.random())).toLowerCase().substr(10, 10);

  constructor(readonly config: SimulationConfiguration, readonly name = config.simulation_config.simulation_name) {
  }

}
