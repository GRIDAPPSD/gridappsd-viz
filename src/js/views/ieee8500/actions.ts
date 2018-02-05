import { Action } from '../../models/Action';

export const SET_GEOGRAPHICAL_REGION_NAME = 'SET_GEOGRAPHICAL_REGION_NAME';
export const SET_SUBGEOGRAPHICAL_REGION_NAME = 'SET_SUBGEOGRAPHICAL_REGION_NAME';
export const SET_LINE_NAME = 'SET_LINE_NAME';
export const SET_DURATION = 'SET_DURATION';
export const SET_SIMULATOR = 'SET_SIMULATOR';
export const SET_TIMESTEP_FREQUENCY = 'SET_TIMESTEP_FREQUENCY';
export const SET_TIMESTEP_INCREMENT = 'SET_TIMESTEP_INCREMENT';
export const SET_SIMULATION_NAME = 'SET_SIMULATION_NAME';
export const SET_POWER_FLOW_SOLVER_METHOD = 'SET_POWER_FLOW_SOLVER_METHOD';
export const SET_APPLICATION_CONFIGURATION = 'SET_APPLICATION_CONFIGURATION';

export type RequestConfigActions = SetGeographicalRegionName | SetSubGeographicalRegionName |
  SetLineName | SetDuration | SetSimulator | SetTimestepFrequency | SetTimestepIncrement |
  SetSimulationName | SetPowerFlowSolverMethod | SetApplicationConfiguration;

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

export class SetApplicationConfiguration extends Action {
  readonly type = SET_APPLICATION_CONFIGURATION;
  constructor(readonly app: string, readonly configStr: string) {
    super();
  }
}