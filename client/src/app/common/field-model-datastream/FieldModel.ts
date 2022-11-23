import { generateUniqueId } from '@client:common/misc';

import { FieldModelConfiguration } from './FieldModelConfiguration';

export class FieldModel {

  id = generateUniqueId();
  didRun = false;

  constructor(readonly config: FieldModelConfiguration, readonly name = config.simulation_config.simulation_name) {
  }

}
