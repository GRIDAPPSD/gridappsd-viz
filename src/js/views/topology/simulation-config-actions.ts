import { Action } from '../../models/Action';
import { OutputObject } from '../../models/OutputObject';

export const SET_GEOGRAPHICAL_REGION_NAME = 'SET_GEOGRAPHICAL_REGION_NAME';
export const SET_SUBGEOGRAPHICAL_REGION_NAME = 'SET_SUBGEOGRAPHICAL_REGION_NAME';
export const SET_LINE_NAME = 'SET_LINE_NAME';
export const SET_DURATION = 'SET_DURATION';
export const SET_SIMULATOR = 'SET_SIMULATOR';
export const SET_TIMESTEP_FREQUENCY = 'SET_TIMESTEP_FREQUENCY';
export const SET_TIMESTEP_INCREMENT = 'SET_TIMESTEP_INCREMENT';
export const SET_SIMULATION_NAME = 'SET_SIMULATION_NAME';
export const SET_POWER_FLOW_SOLVER_METHOD = 'SET_POWER_FLOW_SOLVER_METHOD';
export const UPDATE_APPLICATION_CONFIGURATION = 'UPDATE_APPLICATION_CONFIGURATION';
export const SET_OUTPUT_OBJECTS = 'SET_OUTPUT_OBJECTS';

export type SimulationConfigActions = SetGeographicalRegionName | SetSubGeographicalRegionName |
  SetLineName | SetDuration | SetSimulator | SetTimestepFrequency | SetTimestepIncrement |
  SetSimulationName | SetPowerFlowSolverMethod | UpdateApplicationConfiguration | SetOutputObjects;

export class SetGeographicalRegionName extends Action {
  readonly type = SET_GEOGRAPHICAL_REGION_NAME;
  constructor(readonly value: string) {
    super();
  }
}

export class SetSubGeographicalRegionName extends Action {
  readonly type = SET_SUBGEOGRAPHICAL_REGION_NAME;
  constructor(readonly value: string) {
    super();
  }
}

export class SetLineName extends Action {
  readonly type = SET_LINE_NAME;
  constructor(readonly value: string) {
    super();
  }
}

export class SetDuration extends Action {
  readonly type = SET_DURATION;
  constructor(readonly value: string) {
    super();
  }
}

export class SetSimulator extends Action {
  readonly type = SET_SIMULATOR;
  constructor(readonly value: string) {
    super();
  }
}

export class SetTimestepFrequency extends Action {
  readonly type = SET_TIMESTEP_FREQUENCY;
  constructor(readonly value: string) {
    super();
  }
}

export class SetTimestepIncrement extends Action {
  readonly type = SET_TIMESTEP_INCREMENT;
  constructor(readonly value: string) {
    super();
  }
}

export class SetSimulationName extends Action {
  readonly type = SET_SIMULATION_NAME;
  constructor(readonly value: string) {
    super();
  }
}

export class SetPowerFlowSolverMethod extends Action {
  readonly type = SET_POWER_FLOW_SOLVER_METHOD;
  constructor(readonly value: string) {
    super();
  }
}

export class UpdateApplicationConfiguration extends Action {
  readonly type = UPDATE_APPLICATION_CONFIGURATION;
  constructor(readonly appName: string, readonly configStr: string) {
    super();
  }
}

export class SetOutputObjects extends Action {
  readonly type = SET_OUTPUT_OBJECTS;
  constructor(readonly outputObjects: OutputObject[]) {
    super();
  }
}