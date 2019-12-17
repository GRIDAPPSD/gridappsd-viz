export interface QueryLogsRequestBody {
  startTime: string;
  processId: string;
  username: string;
  source: string;
  processStatus: string;
  logLevel: string;
}
