import { Action } from '../../models/Action';
import { Simulation } from '../../models/Simulation';
import { SimulationConfig } from '../../models/SimulationConfig';
import { FncsOutput } from '../../models/fncs-output/FncsOutput';

export const ADD_SIMULATION = 'ADD_SIMULATION';
export const SET_ACTIVE_SIMULATION_CONFIG = 'SET_ACTIVE_SIMULATION_CONFIG';
export const SET_NEW_FNCS_OUTPUT = 'SET_NEW_FNCS_OUTPUT';

export type SimulationActions = AddSimulation | SetActiveSimulationConfig | SetNewFncsOutput;

export class AddSimulation extends Action {
  readonly type = ADD_SIMULATION;

  constructor(readonly simulation: Simulation) {
    super();
  }
}

export class SetActiveSimulationConfig extends Action {
  readonly type = SET_ACTIVE_SIMULATION_CONFIG;

  constructor(readonly config: SimulationConfig) {
    super();
  }
}

export class SetNewFncsOutput extends Action {
  readonly type = SET_NEW_FNCS_OUTPUT;

  constructor(readonly output: FncsOutput) {
    super();
  }
}