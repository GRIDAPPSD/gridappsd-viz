export interface MessageRequest {
  /**
   * The topic url to which the request is posted to
   */
  url: string;

  /**
   * The request body to send to the message queue
   */
  requestBody: any;

  /**
   * The url from which subscribers can retrieve posted messages
   */
  replyTo: string;
}

export const enum RequestConfigurationType {
  GRID_LAB_D_SYMBOLS = 'GridLAB-D Symbols',
  GRID_LAB_D_ALL = 'GridLAB-D All',
  GRID_LAB_D_BASE_GLM = 'GridLAB-D Base GLM',
  CIM_DICTIONARY = 'CIM Dictionary',
  CIM_FEEDER_INDEX = 'CIM Feeder Index'
}