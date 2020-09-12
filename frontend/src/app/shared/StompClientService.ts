import { Client, Message } from '@stomp/stompjs';
import { BehaviorSubject, Observable, using, timer, iif, of, Subject, zip } from 'rxjs';
import { filter, switchMap, take, timeout, takeWhile } from 'rxjs/operators';

import { ConfigurationManager } from './ConfigurationManager';

export const enum StompClientConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  UNINITIALIZED = 'UNINITIALIZED'
}

export const enum StompClientInitializationStatus {
  OK = '0K',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  CONNECTION_FAILURE = 'CONNECTION_FAILURE'
}

export interface StompClientInitializationResult {

  readonly status: StompClientInitializationStatus;
  readonly token?: string;

}

export interface StompClientRequest {
  destination: string;
  replyTo?: string;
  body: string;
}

export class StompClientService {

  private static readonly _INSTANCE = new StompClientService();

  private readonly _configurationManager = ConfigurationManager.getInstance();

  private _client: Client;
  private _statusChanges = new BehaviorSubject(StompClientConnectionStatus.UNINITIALIZED);
  private _status = StompClientConnectionStatus.UNINITIALIZED;
  private _authenticationToken = '';

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
    zip(
      this._configurationManager.configurationChanges('host'),
      this._configurationManager.configurationChanges('port')
    )
      .subscribe({
        next: ([host, port]) => {
          const isLoggingEnabled = (localStorage.getItem('isLoggingEnabled') ?? String(!__PRODUCTION__)) === 'true';

          this._client = new Client({
            brokerURL: port ? `ws://${host}:${port}` : `ws://${host}`,
            heartbeatIncoming: 0,
            heartbeatOutgoing: 0,
            reconnectDelay: 0,
            // eslint-disable-next-line no-console
            debug: isLoggingEnabled ? console.log : () => { },
            logRawCommunication: isLoggingEnabled
          });
          this._authenticationToken = sessionStorage.getItem('token');
          if (this._authenticationToken) {
            this.reconnect();
          }
        }
      });
  }

  connect(username: string, password: string): Observable<StompClientInitializationResult> {
    const subject = new Subject<StompClientInitializationResult>();
    const noOp = () => { };

    this._client.configure({
      connectHeaders: {
        login: username,
        passcode: password
      },
      onConnect: () => {
        this._retrieveToken(username, password)
          .then(() => {
            this._client.onDisconnect = () => {
              this.reconnect();
              subject.next({
                status: StompClientInitializationStatus.OK,
                token: this._authenticationToken
              });
              this._client.onDisconnect = noOp;
              this._client.onConnect = noOp;
            };
          })
          .catch(() => {
            subject.error({
              status: StompClientInitializationStatus.AUTHENTICATION_FAILURE
            } as StompClientInitializationResult);
          })
          .finally(() => {
            this._client.deactivate();
          });
      },
      onStompError: () => {
        subject.error({
          status: StompClientInitializationStatus.AUTHENTICATION_FAILURE
        } as StompClientInitializationResult);
        this._client.onStompError = noOp;
      },
      onWebSocketError: () => {
        subject.error({
          status: StompClientInitializationStatus.CONNECTION_FAILURE
        });
        this._client.onWebSocketError = noOp;
      }
    });
    this._client.activate();
    return subject.pipe(take(1));
  }

  private _retrieveToken(username: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const destination = `/queue/temp.token_resp.${username}`;
      this.readOnceFrom<string>(destination)
        .subscribe({
          next: token => {
            if (token !== 'authentication failed') {
              sessionStorage.setItem('token', token);
              this._authenticationToken = token;
              resolve();
            } else {
              reject();
            }
          }
        });
      this.send({
        destination: '/topic/pnnl.goss.token.topic',
        replyTo: destination,
        body: btoa(`${username}:${password}`)
      });
    });
  }

  reconnect() {
    timer(0, 5_000)
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
      this._client.deactivate();
      this._status = StompClientConnectionStatus.CONNECTING;
      this._statusChanges.next(this._status);
      this._client.configure({
        connectHeaders: {
          login: this._authenticationToken,
          passcode: ''
        },
        onConnect: this._connectionEstablished,
        onWebSocketClose: this._connectionClosed
      });
      this._client.activate();
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

  send(request: StompClientRequest) {
    if (this._status !== StompClientConnectionStatus.DISCONNECTED) {
      const headers = Object.assign(
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          GOSS_HAS_SUBJECT: true as any,
          GOSS_SUBJECT: this._authenticationToken
        },
        request.replyTo ? { 'reply-to': request.replyTo } : {}
      );
      timer(0, 500)
        .pipe(
          takeWhile(() => this._status !== StompClientConnectionStatus.DISCONNECTED),
          filter(this.isActive),
          take(1),
        )
        .subscribe({
          next: () => {
            this._client.publish({
              destination: request.destination,
              headers,
              body: request.body
            });
          }
        });
    }
  }

  statusChanges(): Observable<StompClientConnectionStatus> {
    return this._statusChanges.asObservable();
  }

  /**
   * Subscribe to destination, then unsubscribe right away after a response arrives
   * @param destination The topic to subscribe to from which to get the response
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readOnceFrom<T = any>(destination: string): Observable<T> {
    return this.readFrom<T>(destination)
      .pipe(take(1));
  }

  /**
   * Subscribe to destination, and continuously watch for responses from the server
   * @param destination The topic to subscribe to from which to get the response
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readFrom<T = any>(destination: string): Observable<T> {
    return timer(0, 1000)
      .pipe(
        filter(this.isActive),
        take(1),
        switchMap(() => {
          const source = new BehaviorSubject<T>(null);
          const id = `${destination}[${Math.random() * 1_000_000 | 0}]`;
          return using(() => this._client.subscribe(destination, (message: Message) => {
            const body = message.body;
            try {
              const payload = JSON.parse(body);
              if ('error' in payload) {
                source.error(payload.error.message);
              } else if (!('data' in payload)) {
                source.next(payload);
              } else if (typeof payload.data !== 'string') {
                source.next(payload.data);
              } else {
                source.next(JSON.parse(payload.data));
              }
            } catch {
              source.next(body as unknown as T);
            }
          }, { id }), () => source.asObservable().pipe(filter(responseBody => Boolean(responseBody))));
        })
      );
  }

}
