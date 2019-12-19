export interface SimulationSnapshot {
  topologyModel: any;
  stateStore: any;
  totalVoltageViolations: number;
  violationsAtZero: number;
  alarms: any[];
  activeSimulation: any;
  measurementChartModels: any[];
  simulationOutput: any;
}


export const DEFAULT_SIMULATION_SNAPSHOT: SimulationSnapshot = {
  topologyModel: null,
  stateStore: null,
  totalVoltageViolations: -1,
  violationsAtZero: -1,
  alarms: [],
  measurementChartModels: [],
  activeSimulation: null,
  simulationOutput: null
};
