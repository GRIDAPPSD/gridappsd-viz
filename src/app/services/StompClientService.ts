import { client, Client, StompHeaders, Message, StompSubscription } from '@stomp/stompjs';

import { RUN_CONFIG } from '../../../runConfig';
import { Subject, Observable } from 'rxjs';

export type StompClientConnectionStatus = 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'INIT';

export class StompClientService {
  private static readonly _INSTANCE = new StompClientService();
  private _client: Client;
  private _statusChanges = new Subject<StompClientConnectionStatus>();
  private _attempt = 0;
  private _status: StompClientConnectionStatus = 'INIT';
  private _connectionInProgress;

  private constructor() {
    this._reconnect = this._reconnect.bind(this);
    this._statusChanges.next(this._status);
    this._connect();
  }

  static getInstance() {
    return StompClientService._INSTANCE;
  }

  isActive() {
    return this._client ? this._client.connected : false;
  }

  reconnect() {
    this._reset();
    this._reconnect();
  }

  send(destination: string, headers: StompHeaders = {}, body: string = '') {
    if (this.isActive())
      this._client.send(destination, headers, body);
    else {
      const repeater = setInterval(() => {
        if (!this._client)
          clearInterval(repeater);
        else if (this.isActive()) {
          this._client.send(destination, headers, body);
          clearInterval(repeater);
        }
      }, 500);
    }
  }

  statusChanges(): Observable<StompClientConnectionStatus> {
    return this._statusChanges.asObservable();
  }

  subscribe(destination: string, callback: (message: Message) => void): Promise<StompSubscription> {
    if (this.isActive())
      return Promise.resolve()
        .then(() => this._client.subscribe(destination, message => callback(message)));
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
      .then(() => this._client.subscribe(destination, message => callback(message)));
  }

  private _connect() {
    if (this.isActive())
      this._client.disconnect();
    this._client = client(RUN_CONFIG.gossServerUrl);
    this._client.heartbeat.outgoing = 0;
    this._client.heartbeat.incoming = 0;
    this._connectionInProgress = setTimeout(() => {
      this._client.connect(
        'system',
        'manager',
        () => {
          this._status = 'CONNECTED';
          this._statusChanges.next(this._status);
          clearTimeout(this._connectionInProgress);
          this._attempt = 0;
        },
        this._reconnect,
        this._reconnect);
    }, this._status === 'INIT' ? 0 : 5000);
  }

  private _reconnect() {
    if (this._attempt < 3) {
      this._connect();
      this._attempt++;
      this._status = this._status === 'INIT' ? 'INIT' : 'CONNECTING';
      this._statusChanges.next(this._status);
    }
    else if (this._attempt === 3)
      this._reset();
  }

  private _reset() {
    this._status = 'NOT_CONNECTED';
    this._statusChanges.next(this._status);
    if (this._client) {
      this._client.disconnect();
      this._client = null;
    }
    clearTimeout(this._connectionInProgress);
    this._attempt = 0;
  }
}