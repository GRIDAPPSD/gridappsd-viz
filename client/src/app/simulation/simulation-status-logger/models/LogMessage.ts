import { SimulationStatusLogMessage } from '@shared/simulation';

export interface LogMessage {
  id: number;
  content: SimulationStatusLogMessage;
}
