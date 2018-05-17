import { client, Client, StompHeaders, Message, StompSubscription } from '@stomp/stompjs';

import { RUN_CONFIG } from '../../../runConfig';

export class StompClient {
  private static readonly _INSTANCE = new StompClient();
  private readonly _client: Client = client(RUN_CONFIG.gossServerUrl);

  private constructor() {
    this._client.heartbeat.outgoing = 0; // client will send heartbeats every 20000ms
    this._client.heartbeat.incoming = 0;

    this._client.connect('system', 'manager', () => {}, () => {});
  }

  static getInstance() {
    return StompClient._INSTANCE;
  }

  isActive() {
    return this._client.connected;
  }

  send(destination: string, headers: StompHeaders = {}, body: string = '') {
    this._client.send(destination, headers, body);
  }

  subscribe(destination: string, callback: (message: Message) => void): StompSubscription {
    return this._client.subscribe(destination, callback);
  }
}