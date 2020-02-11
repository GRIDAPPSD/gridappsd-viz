import { client, Client, StompHeaders, Message } from '@stomp/stompjs';
import { BehaviorSubject, Observable, using, timer, iif, of, Subject } from 'rxjs';
import { filter, switchMap, take, timeout, takeWhile } from 'rxjs/operators';

import { ConfigurationManager } from './ConfigurationManager';

export const enum StompClientConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  UNINITIALIZED = 'UNINITIALIZED'
}

export const enum StompClientInitializationResult {
  OK = '0K',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  CONNECTION_FAILURE = 'CONNECTION_FAILURE'
}

export class StompClientService {

  private static readonly _INSTANCE = new StompClientService();

  private readonly _configurationManager = ConfigurationManager.getInstance();

  private _client: Client;
  private _statusChanges = new BehaviorSubject<StompClientConnectionStatus>(StompClientConnectionStatus.UNINITIALIZED);
  private _status: StompClientConnectionStatus = StompClientConnectionStatus.UNINITIALIZED;
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
    this._configurationManager.configurationChanges('host')
      .subscribe({
        next: host => {
          this._client = client(`ws://${host}`);
          this._client.heartbeat.outgoing = 0;
          this._client.heartbeat.incoming = 0;

          this._username = sessionStorage.getItem('username');
          this._password = sessionStorage.getItem('password');

          if (this._username && this._password)
            this.reconnect();
        }
      });
  }

  connect(username: string, password: string): Observable<StompClientInitializationResult> {
    const subject = new Subject<StompClientInitializationResult>();
    this._username = username;
    this._password = password;

    this._client.connect(
      this._username,
      this._password,
      () => {
        this._client.disconnect(() => {
          this.reconnect();
          subject.next(StompClientInitializationResult.OK);
        });
        // need to reevaluate this
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('password', password);
      },
      () => subject.error(StompClientInitializationResult.AUTHENTICATION_FAILURE),
      () => subject.error(StompClientInitializationResult.CONNECTION_FAILURE)
    );
    return subject.pipe(take(1));
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
      this._status = StompClientConnectionStatus.CONNECTING;
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

  private _connectionEstablished() {
    this._status = StompClientConnectionStatus.CONNECTED;
    this._statusChanges.next(this._status);
  }

  private _connectionClosed() {
    if (this._status === StompClientConnectionStatus.CONNECTED) {
      this._status = StompClientConnectionStatus.DISCONNECTED;
      this.reconnect();
    }
  }

  private _connectionFailed() {
    this._status = StompClientConnectionStatus.DISCONNECTED;
    this._statusChanges.next(this._status);
  }

  send(destination: string, headers: StompHeaders, body: string) {
    if (this._status !== StompClientConnectionStatus.DISCONNECTED) {
      headers = {
        ...headers,
        GOSS_HAS_SUBJECT: true as any,
        GOSS_SUBJECT: this._username
      };
      timer(0, 500)
        .pipe(
          // In case the status is CONNECTING, then the connection failed
          takeWhile(() => this._status !== StompClientConnectionStatus.DISCONNECTED),
          filter(this.isActive),
          take(1),
        )
        .subscribe(() => this._client.send(destination, headers, body));
    }
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
    return timer(0, 1000)
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
