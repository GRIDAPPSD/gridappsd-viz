import { SimulationStatusLogMessage } from '@shared/simulation';

export interface LogMessage {
  id: string;
  content: SimulationStatusLogMessage;
}
