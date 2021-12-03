/**
 * The request body sent when the submit button in the "LOGS" tab
 * inside the "Browse Data" is clicked
 */
export interface QueryLogsRequestBody {
  /**
   * Value of the "Start time" form field
   */
  startTime: string;

  /**
   * The process ID of the simulation ID, {@see SimulationId} inside models directory
   */
  processId: string;

  /**
   * Value of the "Username" form field
   */
  username: string;

  /**
   * Value of the "Source" form field
   */
  source: string;

  /**
   * Value of the "Process status" form field
   */
  processStatus: string;

  /**
   * Value of the "Log level" form field
   */
  logLevel: string;
}
