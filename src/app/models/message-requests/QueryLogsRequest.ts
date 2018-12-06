import { MessageRequest } from './MessageRequest';

export class QueryLogsRequest implements MessageRequest {
  url: string;
  requestBody: any;
  replyTo: string;
}

export interface QueryLogsRequestBody {
  startTime: string;
  processID: string;
  processStatus: string;
  logLevel: string;
  source: string;
}