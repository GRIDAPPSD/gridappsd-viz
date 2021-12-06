/* eslint-disable @typescript-eslint/no-empty-function */
import { Client, Message } from '@stomp/stompjs';
import { BehaviorSubject, Observable, using, timer, Subject, zip } from 'rxjs';
import { filter, switchMap, take, takeWhile, tap, timeout } from 'rxjs/operators';

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

/**
 * An abstraction around StompJS client that makes use of RxJS to enable
 * more convenient data transformation
 */
export class StompClientService {

  private static readonly _INSTANCE_ = new StompClientService();

  private readonly _configurationManager = ConfigurationManager.getInstance();
  private readonly _client = new Client();
  private readonly _statusChanges = new BehaviorSubject(StompClientConnectionStatus.UNINITIALIZED);

  private _status = StompClientConnectionStatus.UNINITIALIZED;
  private _authenticationToken = '';
  private _username = '';
  private _password = '';

  static getInstance() {
    return StompClientService._INSTANCE_;
  }

  private constructor() {

    this.reconnect = this.reconnect.bind(this);
    this.isActive = this.isActive.bind(this);
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
          const isLoggingEnabled = localStorage.getItem('isLoggingEnabled') === 'true' || __DEVELOPMENT__;

          this._client.configure({
            brokerURL: port ? `ws://${host}:${port}` : `ws://${host}`,
            heartbeatIncoming: 0,
            heartbeatOutgoing: 0,
            reconnectDelay: 0,
            debug: isLoggingEnabled
              // eslint-disable-next-line no-console
              ? console.log
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              : () => { },
            logRawCommunication: isLoggingEnabled
          });
          if (__DEVELOPMENT__) {
            this._authenticationToken = sessionStorage.getItem('token');
            if (this._authenticationToken) {
              this.reconnect();
            }
          }
        }
      });
  }

  /**
   * Try to establish a connection to the message broker using the provided username and password.
   *
   * @param username
   * @param password
   */
  connect(username: string, password: string): Observable<StompClientInitializationResult> {
    const subject = new Subject<StompClientInitializationResult>();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const noOp = () => { };

    this._client.configure({
      connectHeaders: {
        login: username,
        passcode: password
      },
      onConnect: () => {
        this._username = username;
        this._password = password;

        this._retrieveToken(username, password)
          .then(token => {
            if (__DEVELOPMENT__) {
              sessionStorage.setItem('token', token);
            }
            this._authenticationToken = token;
            this._client.onDisconnect = () => {
              this.reconnect();
              subject.next({
                status: StompClientInitializationStatus.OK,
                token: this._authenticationToken
              });
              this._client.onDisconnect = noOp;
            };
          })
          .catch(() => {
            subject.error({
              status: StompClientInitializationStatus.AUTHENTICATION_FAILURE
            } as StompClientInitializationResult);
          })
          .finally(() => {
            /*
             *  The previous established connection was used for the initial authentication,
             *  when the authentication was successful, we want to close the previous connection
             *  and create a new one, that's why we are calling `deactivate` here, so that the
             *  `onDisconnect` callback from right above gets called which reconnects to the server
             */
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

  /**
   * Read the authentication token from a previously agreed-upon topic
   *
   * @param username
   * @param password
   */
  private _retrieveToken(username: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const destination = `/queue/temp.token_resp.${username}`;
      this.readOnceFrom<string>(destination)
        .subscribe({
          next: token => {
            if (token !== 'authentication failed') {
              resolve(token);
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

  /**
   * Attempt to reconnect the message broker every 5 seconds, will time out after trying for 25 seconds
   */
  reconnect() {
    timer(0, 5_000)
      .pipe(
        takeWhile(() => !this.isActive()),
        tap(() => this._connect()),
        filter(this.isActive),
        timeout(25_000)
      )
      .subscribe({
        error: () => {
          /*
           *  A race condition could occur when as soon as the timer times out, and the platform is
           *  successfully restarted, then when `reconnect()` is called, it will be a no-op since
           *  `takeWhile` will always terminate the timer, because `isActive()` will always return true,
           *  so we want to check against that before notifying connection status change to DISCONNECTED
           */
          if (!this.isActive()) {
            this._authenticationToken = '';
            this._notifyConnectionStatusChange(StompClientConnectionStatus.DISCONNECTED);
          }
        }
      });
  }

  private _connect() {
    this._client.deactivate();
    this._notifyConnectionStatusChange(StompClientConnectionStatus.CONNECTING);
    if (this._authenticationToken !== '') {
      this._client.configure({
        connectHeaders: {
          login: this._authenticationToken,
          passcode: ''
        },

        /*
         *  This is called when the authentication token in this session isn't valid anymore,
         *  so when the server tries to authenticate using the saved token, it fails the authentication
         *  and this only happens when the server is restarted so the token for this session is destroyed.
         */
        onStompError: () => {
          sessionStorage.removeItem('token');
          this._authenticationToken = '';
          this._notifyConnectionStatusChange(StompClientConnectionStatus.DISCONNECTED);
        },
        onConnect: () => {
          this._notifyConnectionStatusChange(StompClientConnectionStatus.CONNECTED);
        },

        /*
         *  This is called the websocket between the client and platform times out
         *  or when the platform is stopped.
         */
        onWebSocketClose: () => {
          /*
           *  This is true when the web socket connection times out in
           *  which case the status is still `StompClientConnectionStatus.CONNECTED`,
           *  so we want to recover from the timeout by reconnecting again.
           */
          if (this._status === StompClientConnectionStatus.CONNECTED) {
            this.reconnect();
          }
        }
      });
      this._client.activate();
    } else {
      this.connect(this._username, this._password).subscribe();
    }
  }

  isActive() {
    return this._client ? this._client.connected : false;
  }

  private _notifyConnectionStatusChange(status: StompClientConnectionStatus) {
    this._status = status;
    this._statusChanges.next(status);
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
          take(1)
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
   *
   * @param destination The topic to subscribe to from which to get the response
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readOnceFrom<T = any>(destination: string): Observable<T> {
    return this.readFrom<T>(destination)
      .pipe(take(1));
  }

  /**
   * Subscribe to destination, and continuously watch for responses from the server
   *
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
          const id = `${destination}[${Math.trunc(Math.random() * 1_000_000)}]`;
          return using(() => this._client.subscribe(destination, (message: Message) => {
            const body = message.body;
            try {
              const payload = JSON.parse(body);
              if ('error' in payload) {
                const errorMessageLines = payload.error.message.split('\n');
                source.error(errorMessageLines[0]);
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
