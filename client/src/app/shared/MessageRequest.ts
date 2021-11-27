// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MessageRequest<T = any> {
  /**
   * The topic url to which the request is posted to
   */
  readonly url: string;

  /**
   * The request body to send to the message queue
   */
  readonly requestBody: T;

  /**
   * The url from which subscribers can retrieve posted messages
   */
  readonly replyTo: string;
}

export const enum RequestConfigurationType {
  GRID_LAB_D_SYMBOLS = 'GridLAB-D Symbols',
  GRID_LAB_D_ALL = 'GridLAB-D All',
  GRID_LAB_D_BASE_GLM = 'GridLAB-D Base GLM',
  GRID_LAB_D_LIMITS = 'GridLAB-D Limits',
  CIM_DICTIONARY = 'CIM Dictionary',
  CIM_FEEDER_INDEX = 'CIM Feeder Index'
}
