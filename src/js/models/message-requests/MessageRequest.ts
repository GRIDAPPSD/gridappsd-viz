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