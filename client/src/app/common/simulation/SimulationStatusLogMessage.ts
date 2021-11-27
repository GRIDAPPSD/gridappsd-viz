export interface SimulationStatusLogMessage {
  source: string;
  processId: string;
  timestamp: number;
  processStatus: 'STARTING' | 'STARTED' | 'RUNNING' | 'PAUSED' | 'COMPLETE';
  logMessage: string;
  logLevel: string;
  storeToDb: boolean;
}
