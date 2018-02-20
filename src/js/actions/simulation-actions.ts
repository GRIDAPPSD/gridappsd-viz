import { Action } from "../models/Action";
import { Simulation } from "../models/Simulation";
import { SimulationConfig } from "../models/SimulationConfig";

export const ADD_SIMULATION = 'ADD_SIMULATION';
export const SET_ACTIVE_SIMULATION_CONFIG = 'SET_ACTIVE_SIMULATION_CONFIG';

export type SimulationActions = AddSimulation | SetActiveSimulationConfig;

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