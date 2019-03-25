import { client, Client, StompHeaders, Message } from '@stomp/stompjs';
import { BehaviorSubject, Observable, interval, using, timer, iif, of } from 'rxjs';
import { filter, switchMap, take, timeout } from 'rxjs/operators';

import { RUN_CONFIG } from '../../../runConfig';

export type StompClientConnectionStatus = 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'NEW';

export class StompClientService {
  private static readonly _INSTANCE = new StompClientService();
  private _client: Client;
  private _statusChanges = new BehaviorSubject<StompClientConnectionStatus>('NEW');
  private _status: StompClientConnectionStatus = 'NEW';

  private constructor() {
    this._client = client(RUN_CONFIG.gossServerUrl);
    this._client.heartbeat.outgoing = 0;
    this._client.heartbeat.incoming = 0;

    this._connectionFailed = this._connectionFailed.bind(this);
    this._connectionEstablished = this._connectionEstablished.bind(this);
    this._connectionClosed = this._connectionClosed.bind(this);
    this.isActive = this.isActive.bind(this);
    this.connect = this.connect.bind(this);

    this.connect();
  }

  static getInstance() {
    return StompClientService._INSTANCE;
  }

  connect() {
    timer(0, 5000)
      .pipe(
        switchMap(() => iif(this.isActive, of(null), of(this._connect()))),
        filter(this.isActive),
        timeout(25_000),
        take(1)
      )
      .subscribe({
        error: this._connectionFailed
      });
  }

  isActive() {
    return this._client ? this._client.connected : false;
  }

  private _connect() {
    if (!this.isActive()) {
      this._status = 'CONNECTING';
      this._statusChanges.next(this._status);
      return this._client.connect('system', 'manager', this._connectionEstablished, undefined, this._connectionClosed);
    }
    return {};
  }

  private _connectionEstablished() {
    this._status = 'CONNECTED';
    this._statusChanges.next(this._status);
  }

  private _connectionClosed() {
    if (this._status === 'CONNECTED') {
      this._status = 'NOT_CONNECTED';
      this.connect();
    }
  }

  private _connectionFailed() {
    this._status = 'NOT_CONNECTED';
    this._statusChanges.next(this._status);
  }

  send(destination: string, headers: StompHeaders, body: string) {
    timer(0, 500)
      .pipe(filter(this.isActive), take(1))
      .subscribe(() => this._client.send(destination, headers, body));
  }

  statusChanges(): Observable<StompClientConnectionStatus> {
    return this._statusChanges.asObservable();
  }

  /**
   * Subscribe to destination, then unsubscribe right away after a response arrives
   * @param destination The topic to subscribe to to get the response from
   */
  readOnceFrom(destination: string): Observable<string> {
    return this.readFrom(destination)
      .pipe(take(1));
  }

  /**
   * Subscribe to destination, and continuously watch for responses from the server
   * @param destination The topic to subscribe to to get the response from
   */
  readFrom(destination: string): Observable<string> {
    return interval(1000)
      .pipe(
        filter(this.isActive),
        take(1),
        switchMap(() => {
          const source = new BehaviorSubject<string>(null);
          const id = `${destination}[${Math.random() * 1_000_000 | 0}]`;
          return using(
            () => this._client.subscribe(destination, (message: Message) => source.next(message.body), { id }),
            () => source.asObservable().pipe(filter(data => Boolean(data)))
          );
        })
      );
  }

}
