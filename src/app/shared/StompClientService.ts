import { client, Client, StompHeaders, Message } from '@stomp/stompjs';
import { BehaviorSubject, Observable, interval, using, timer, iif, of } from 'rxjs';
import { filter, switchMap, take, timeout } from 'rxjs/operators';

import { ConfigurationManager } from './ConfigurationManager';

export type StompClientConnectionStatus = 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'NEW';

export const enum StompClientInitializationResult {
  OK = '0K',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  CONNECTION_FAILURE = 'CONNECTION_FAILURE'
}

export class StompClientService {

  private static readonly _INSTANCE = new StompClientService();

  private readonly _configurationManager = ConfigurationManager.getInstance();

  private _client: Client;
  private _statusChanges = new BehaviorSubject<StompClientConnectionStatus>('NEW');
  private _status: StompClientConnectionStatus = 'NEW';
  private _username = '';
  // Need to store the password for reconnecting after timeout,
  // the backend should listen to hearbeat messages
  // so that this wouldn't be neccessary
  private _password = '';

  static getInstance() {
    return StompClientService._INSTANCE;
  }

  private constructor() {
    this._connectionFailed = this._connectionFailed.bind(this);
    this._connectionEstablished = this._connectionEstablished.bind(this);
    this._connectionClosed = this._connectionClosed.bind(this);
    this.isActive = this.isActive.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.readOnceFrom = this.readOnceFrom.bind(this);
    this.readFrom = this.readFrom.bind(this);

    this._initializeStompClient();
  }

  private _initializeStompClient() {
    this._configurationManager.configurationChanges()
      .subscribe({
        next: configurations => {
          this._client = client(`ws://${configurations.host}`);
          this._client.heartbeat.outgoing = 0;
          this._client.heartbeat.incoming = 0;

          this._username = sessionStorage.getItem('username');
          this._password = sessionStorage.getItem('password');

          if (this._username && this._password)
            this.reconnect();
        }
      });
  }

  connect(username: string, password: string): Promise<StompClientInitializationResult> {
    this._username = username;
    this._password = password;
    return new Promise<StompClientInitializationResult>((resolve, reject) => {
      this._client.connect(
        this._username,
        this._password,
        () => {
          resolve(StompClientInitializationResult.OK);
          this._connectionEstablished();

          // need to reevaluate this
          sessionStorage.setItem('username', username);
          sessionStorage.setItem('password', password);
        },
        () => reject(StompClientInitializationResult.AUTHENTICATION_FAILURE),
        () => reject(StompClientInitializationResult.CONNECTION_FAILURE)
      );
    });
  }

  private _connectionEstablished() {
    this._status = 'CONNECTED';
    this._statusChanges.next(this._status);
  }

  reconnect() {
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
      return this._client.connect(
        this._username,
        this._password,
        this._connectionEstablished,
        undefined,
        this._connectionClosed
      );
    }
    return {};
  }

  private _connectionClosed() {
    if (this._status === 'CONNECTED') {
      this._status = 'NOT_CONNECTED';
      this.reconnect();
    }
  }

  private _connectionFailed() {
    this._status = 'NOT_CONNECTED';
    this._statusChanges.next(this._status);
  }

  send(destination: string, headers: StompHeaders, body: string) {
    headers = {
      ...headers,
      GOSS_HAS_SUBJECT: true as any,
      GOSS_SUBJECT: this._username
    };
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
            () => source.asObservable().pipe(filter(responseBody => Boolean(responseBody)))
          );
        })
      );
  }

}
