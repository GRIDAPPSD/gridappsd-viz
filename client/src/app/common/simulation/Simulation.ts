import { generateUniqueId } from '@client:common/misc';

import { SimulationConfiguration } from './SimulationConfiguration';

export class Simulation {

  id = generateUniqueId();
  didRun = false;

  constructor(readonly config: SimulationConfiguration, readonly name = config.simulation_config.simulation_name) {
  }

}
