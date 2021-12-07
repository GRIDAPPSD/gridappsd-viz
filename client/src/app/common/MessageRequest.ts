/**
 * This interface represents an abstract request that is sent
 * by the STOMP client to a message broker.
 */
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
