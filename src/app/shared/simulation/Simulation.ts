import { SimulationConfiguration } from './SimulationConfiguration';
import { generateUniqueId } from '@shared/misc';

export class Simulation {

  id = generateUniqueId();

  constructor(readonly config: SimulationConfiguration, readonly name = config.simulation_config.simulation_name) {
  }

}
