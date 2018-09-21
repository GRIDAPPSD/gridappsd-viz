import { client, Client, StompHeaders, Message, StompSubscription } from '@stomp/stompjs';

import { RUN_CONFIG } from '../../../runConfig';

export class StompClientService {
  private static readonly _INSTANCE = new StompClientService();
  private readonly _client: Client = client(RUN_CONFIG.gossServerUrl);

  private constructor() {
    this._client.heartbeat.outgoing = 0; // client will send heartbeats every 20000ms
    this._client.heartbeat.incoming = 0;

    this._client.connect('system', 'manager', () => { }, () => { });
  }

  static getInstance() {
    return StompClientService._INSTANCE;
  }

  isActive() {
    return this._client.connected;
  }

  send(destination: string, headers: StompHeaders = {}, body: string = '') {
    const repeater = setInterval(() => {
      if (this.isActive()) {
        this._client.send(destination, headers, body);
        clearInterval(repeater);
      }
    }, 500);
  }

  subscribe(destination: string, callback: (message: Message, subscription: StompSubscription) => void): Promise<void> {
    if (this.isActive())
      return Promise.resolve()
        .then(() => {
          const subscription = this._client.subscribe(destination, message => callback(message, subscription));
        });
    return new Promise<void>((resolve, reject) => {
      let attempt = 0;
      const repeater = setInterval(() => {
        if (this.isActive()) {
          clearInterval(repeater);
          resolve();
        }
        else {
          attempt++;
          if (attempt === 10) {
            reject('Unable to establish connection to the platform');
            clearInterval(repeater);
          }
        }
      }, 500);
    })
      .then(() => {
        const subscription = this._client.subscribe(destination, message => callback(message, subscription));
      });
  }
}