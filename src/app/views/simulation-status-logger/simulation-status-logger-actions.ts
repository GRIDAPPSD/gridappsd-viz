import { Action } from '../../models/Action';

export const SET_SIMULATION_ID = 'SET_SIMULATION_ID';

export class SetSimulationId extends Action {
  readonly type = SET_SIMULATION_ID;
  constructor(readonly simulationName: string, readonly simulationId: string) {
    super();
  }
}