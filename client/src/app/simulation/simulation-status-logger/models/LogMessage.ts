import { SimulationStatusLogMessage } from '@client:common/simulation';

export interface LogMessage {
  id: number;
  content: SimulationStatusLogMessage;
}
