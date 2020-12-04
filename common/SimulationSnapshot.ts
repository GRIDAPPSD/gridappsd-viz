export interface SimulationSnapshot {
  topologyModel: any;
  stateStore: any;
  totalVoltageViolations: number;
  violationsAtZero: number;
  voltageViolationTimestamp: string;
  alarms: any[];
  activeSimulation: any;
  renderableChartModels: any[];
  simulationOutput: any;
}


export const DEFAULT_SIMULATION_SNAPSHOT: SimulationSnapshot = {
  topologyModel: null,
  stateStore: null,
  totalVoltageViolations: -1,
  violationsAtZero: -1,
  voltageViolationTimestamp: '',
  alarms: [],
  renderableChartModels: [],
  activeSimulation: null,
  simulationOutput: null
};
