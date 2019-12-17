export interface SimulationStatusLogMessage {
  source: string;
  processId: string;
  timestamp: number;
  processStatus: 'RUNNING' | 'COMPLETE';
  logMessage: string;
  logLevel: string;
  storeToDb: boolean;
}
