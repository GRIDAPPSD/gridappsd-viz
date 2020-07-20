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

export const enum StompClientInitializationResult {
  OK = '0K',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  CONNECTION_FAILURE = 'CONNECTION_FAILURE'
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
  private _statusChanges = new BehaviorSubject<StompClientConnectionStatus>(StompClientConnectionStatus.UNINITIALIZED);
  private _status = StompClientConnectionStatus.UNINITIALIZED;
  private _username = '';
  private _token = null;

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
    zip(
      this._configurationManager.configurationChanges('host'),
      this._configurationManager.configurationChanges('port')
    )
      .subscribe({
        next: ([host, port]) => {
          this._client = new Client({
            brokerURL: `ws://${host}:${port}`,
            heartbeatIncoming: 0,
            heartbeatOutgoing: 0,
            reconnectDelay: 0,
            // eslint-disable-next-line no-console
            debug: __ENABLE_STOMP_CLIENT_LOGS__ ? console.log : () => { },
            logRawCommunication: __ENABLE_STOMP_CLIENT_LOGS__
          });

          this._username = sessionStorage.getItem('username');
          this._password = sessionStorage.getItem('password');
		  //todo get token
          if (this._username && this._password) {
            this._client.connectHeaders = {
              login: this._username,
              passcode: this._password
            };
            this.reconnect();
          }
        }
      });
  }

  connect(username: string, password: string): Observable<StompClientInitializationResult> {
    const subject = new Subject<StompClientInitializationResult>();
    this._username = username;
    this._password = password;
	this._token = this._getToken();
	
    this._client.configure({
      connectHeaders: {
        login: this._token,
        passcode: ""
      },
      onConnect: () => {
        this._client.onDisconnect = () => {
          this.reconnect();
          subject.next(StompClientInitializationResult.OK);
          this._client.onDisconnect = null;
          this._client.onConnect = null;
        };
        this._client.deactivate();
        // need to reevaluate this strategy
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('password', password);
      },
      onStompError: () => {
        subject.error(StompClientInitializationResult.AUTHENTICATION_FAILURE);
        this._client.onStompError = null;
      },
      onWebSocketError: () => {
        subject.error(StompClientInitializationResult.CONNECTION_FAILURE);
        this._client.onWebSocketError = null;
      }
    });
    this._client.activate();
    return subject.pipe(take(1));
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


  private _getToken() {
	  
	if(this._token==null){  
        //get token
        //get initial connection
        var replyDest = "temp.token_resp."+this._username;

        //create token request string
        var userAuthStr = this._username+":"+this._password;
		let buff = new Buffer(userAuthStr);
		let base64Str = buff.toString('base64');
        //var base64Str = base64.b64encode(userAuthStr.encode());

        //set up token callback
        //send request to token topic
        tokenTopic = "/topic/pnnl.goss.token.topic";


		tmpClient.configure({
		  connectHeaders: {
				login: this._username,
			passcode: this._password
		  },
		  onConnect: () => {
			tmpClient.onDisconnect = () => {
			  //this.reconnect();
			  subject.next(StompClientInitializationResult.OK);
			  tmpClient.onDisconnect = null;
			  tmpClient.onConnect = null;
			};
			this._client.deactivate();
			// need to reevaluate this strategy
			sessionStorage.setItem('username', this._username);
			sessionStorage.setItem('password', this._password);
		  },
		  onStompError: () => {
			subject.error(StompClientInitializationResult.AUTHENTICATION_FAILURE);
			tmpClient.onStompError = null;
		  },
		  onWebSocketError: () => {
			subject.error(StompClientInitializationResult.CONNECTION_FAILURE);
			tmpClient.onWebSocketError = null;
		  }
		});
		tmpClient.activate();




        //tmpConn = Connection([(self.stomp_address, self.stomp_port)])
        //if self._override_thread_fc is not None:
        //    tmpConn.transport.override_threading(self._override_thread_fc)
        //tmpConn.connect(self.__user, self.__pass, wait=True)
                
        //        class TokenResponseListener():
        //            def __init__(self):
        //                self.__token = None

        //            def get_token(self):
        //                return self.__token

        //            def on_message(self, header, message):
        //                _log.debug("Internal on message is: {} {}".format(header, message))
        //                
        //                self.__token = str(message)
         //           def on_error(self, headers, message): 
        //                _log.error("ERR: {}".format(headers))
        //                _log.error("OUR ERROR: {}".format(message))

        //            def on_disconnect(self, header, message):
        //                _log.debug("Disconnected")
        //        #receive token and set token variable
        //        #set callback
        //        listener = TokenResponseListener()
        //        #self.subscribe(replyDest, listener)
		tmpClient.subscribe('/queue/'+replyDest, (message: Message) => {
                const payload = JSON.parse(message.body);
                console.log("received message "+payload);
				this._token = payload;
              }        

        //tmpConn.subscribe('/queue/'+replyDest, 123)
   		//tmpConn.set_listener('token_resp', listener);
        //
		//TODO
		//send({
        //  destination: tokenTopic,
        //  replyTo: replyDest,
        //  body: base64Str
        //});
		console.log("send auth str "+base64Str);
               //// tmpConn.send(body=base64Str, destination=tokenTopic,
                //        headers={'reply-to': replyDest})
        //while token is null or for x iterations
               // iter=0
                //while((self.__token is None) and (iter<10)):
                //    #wait
                //    self.__token = listener.get_token()
                //    sleep(1)
               //     iter+=1

    }
  }



  send(request: StompClientRequest) {
    if (this._status !== StompClientConnectionStatus.DISCONNECTED) {
      const headers = Object.assign(
        {
          GOSS_HAS_SUBJECT: true as any,
          GOSS_SUBJECT: this._token
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
   * @param destination The topic to subscribe to to get the response from
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readOnceFrom<T = any>(destination: string): Observable<T> {
    return this.readFrom<T>(destination)
      .pipe(take(1));
  }

  /**
   * Subscribe to destination, and continuously watch for responses from the server
   * @param destination The topic to subscribe to to get the response from
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
          return using(
            () => this._client.subscribe(destination, (message: Message) => {
              const payload = JSON.parse(message.body);
              if ('error' in payload) {
                source.error(payload.error.message);
              } else if (!('data' in payload)) {
                source.next(payload);
              } else if (typeof payload.data !== 'string') {
                source.next(payload.data);
              } else {
                source.next(JSON.parse(payload.data));
              }
            }, { id }),
            () => source.asObservable().pipe(filter(responseBody => Boolean(responseBody)))
          );
        })
      );
  }

}
