import { Action } from '../../models/Action';
import { Simulation } from '../../models/Simulation';
import { SimulationConfig } from '../../models/SimulationConfig';
import { SimulationOutput } from '../../models/simulation-output/SimulationOutput';

export const REPLACE_SIMULATION = 'ADD_SIMULATION';
export const SET_ACTIVE_SIMULATION_CONFIG = 'SET_ACTIVE_SIMULATION_CONFIG';
export const SET_NEW_SIMULATION_OUTPUT = 'SET_NEW_SIMULATION_OUTPUT';

export type SimulationActions = ReplaceSimulation | SetActiveSimulationConfig | SetNewSimulationOutput;

export class ReplaceSimulation extends Action {
  readonly type = REPLACE_SIMULATION;

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

export class SetNewSimulationOutput extends Action {
  readonly type = SET_NEW_SIMULATION_OUTPUT;

  constructor(readonly output: SimulationOutput) {
    super();
  }
}