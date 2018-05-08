import { Message, StompSubscription } from '@stomp/stompjs';

import { STOMP_CLIENT } from './stomp-client';

import { GetAllFeederModelsRequest, GetAllFeederModelsRequestPayload } from '../models/message-requests/GetAllFeederModelsRequest';
import { GetTopologyModelRequest, GetTopologyModelRequestPayload } from '../models/message-requests/GetTopologyModelRequest';
import { GetCimDictionaryRequest } from '../models/message-requests/GetCimDictionaryRequest';
import { CimDictionary } from '../models/cim-dictionary/CimDictionary';
import { QueryBlazeGraphRequest, QueryBlazeGraphRequestBody } from '../models/message-requests/QueryBlazeGraphRequest';
import { GetApplicationsAndServices, GetApplicationsAndServicesPayload } from '../models/message-requests/GetApplicationsAndServicesRequest';

// const RESPONSE_QUEUE_TOPIC = '/temp-queue/response-queue';
// const SIMULATION_STATUS_TOPIC = '/topic/goss.gridappsd.simulation.log.';
// const FNCS_OUTPUT_TOPIC = '/topic/goss.gridappsd.fncs.output';


export class MessageService {

  private static readonly _INSTANCE_: MessageService = new MessageService();
  private readonly _getTopologyModelRequest = new GetTopologyModelRequest();
  private readonly _getAllFeederModelsRequest = new GetAllFeederModelsRequest();
  private readonly _getCimDictionaryRequest = new GetCimDictionaryRequest();
  private readonly _queryBlazeGraphRequest = new QueryBlazeGraphRequest();
  private readonly _getApplicationsAndServices = new GetApplicationsAndServices();
  private _isConnected = false;

  private constructor() {
    STOMP_CLIENT.heartbeat.outgoing = 0;
    STOMP_CLIENT.heartbeat.incoming = 0;
    STOMP_CLIENT.connect('system', 'manager', () => this._isConnected = true, () => this._isConnected = false);
  }

  static getInstance(): MessageService {
    return MessageService._INSTANCE_;
  }

  /**
   * Returns whether the connection between the stomp client and the backend
   * has been established
   */
  isActive(): boolean {
    return this._isConnected;
  }

  fetchApplicationsAndServices() {
    STOMP_CLIENT.send(
      this._getApplicationsAndServices.url,
      { 'reply-to': this._getApplicationsAndServices.url },
      this._getApplicationsAndServices.requestBody
    );
  }

  /**
   * Send a request to the topic to requesting all the feeders to populate the simulation
   * configuration form
   * @see {@link MessageRequest.onFeederModelsReceived(fn: (payload: GetAllFeederModelsRequestPayload) => void)}
   */
  fetchAllFeederModels() {
    STOMP_CLIENT.send(
      this._getAllFeederModelsRequest.url,
      { 'reply-to': this._getAllFeederModelsRequest.replyTo },
      this._getAllFeederModelsRequest.requestBody
    );
  }

  /**
   * Send a request to the platform request the model dictionary
   * @param mrid The MRID for which to request the model dictionary
   * @see {@link MessageRequest.onCimDictionaryReceived(fn: (payload: CimDictionary) => void)}
   */
  fetchCimDictionary(mrid = '') {
    if (mrid !== '')
      this._getCimDictionaryRequest.requestBody.parameters.model_id = mrid;
    STOMP_CLIENT.send(
      this._getCimDictionaryRequest.url,
      { 'reply-to': this._getCimDictionaryRequest.replyTo },
      JSON.stringify(this._getCimDictionaryRequest.requestBody)
    );
  }

  /**
   * Request the blazegraph database data to display in the Browse Database option in the menu.
   * The data returned is determined by the request type in requestBody argument
   * @param requestBody 
   * @see {@link MessageRequest.onBlazeGraphDataReceived(fn: (payload: any) => void)}
   */
  fetchDataFromBlazeGraph(requestBody: QueryBlazeGraphRequestBody) {
    this._queryBlazeGraphRequest.requestBody = requestBody;
    STOMP_CLIENT.send(
      this._queryBlazeGraphRequest.url,
      { 'reply-to': this._queryBlazeGraphRequest.replyTo },
      JSON.stringify(this._queryBlazeGraphRequest.requestBody).replace(/\\"/g, '"')
    );
  }

  /**
   * Request the topology model used to render when the simulation request configuration form is submitted
   * @param mrid The selected MRID (Line name)
   * @see {@link MessageService.onTopologyModelReceived(fn: (payload: GetTopologyModelRequestPayload) => void)}
   */
  fetchTopologyModel(mrid = '') {
    if (mrid !== '')
      this._getTopologyModelRequest.requestBody.parameters.model_id = mrid;
    STOMP_CLIENT.send(
      this._getTopologyModelRequest.url,
      { 'reply-to': this._getTopologyModelRequest.replyTo },
      JSON.stringify(this._getTopologyModelRequest.requestBody)
    );
  }

  onApplicationsAndServicesReceived(fn: (payload: GetApplicationsAndServicesPayload) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._getApplicationsAndServices.url, (message: Message) => {
      const payload = JSON.parse(message.body);
      fn(payload);
    });
  }

  /**
   * Set up the listener that will be invoked when the platform sends back the data in response to
   * a send request to {@link QueryBlazeGraphRequest.replyTo}
   * @see {@link MessageRequest.fetchDataFromBlazeGraph(requestBody: QueryBlazeGraphRequestBody)}
   * @param fn The listener to invoke when the response message arrives
   */
  onBlazeGraphDataReceived(fn: (payload: any) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._queryBlazeGraphRequest.replyTo, (message: Message) => {
      fn(JSON.parse(message.body));
    });
  }

  /**
   * Set up the listener that will be invoked when the platform sends back the data in response to
   * a send request to {@link GetTopologyModelRequest.replyTo}
   * @see {@link MessageRequest.fetchCimDictionary(mrid = '')}
   * @param fn The listener to invoke when the response message arrives
   */
  onCimDictionaryReceived(fn: (payload: CimDictionary) => void): StompSubscription {
    console.log('MainContainer')
    return STOMP_CLIENT.subscribe(this._getCimDictionaryRequest.replyTo, (message: Message) => {
      const payload = JSON.parse(message.body);
      payload.data = JSON.parse(payload.data);
      payload.requestType = this._getCimDictionaryRequest.requestBody.configurationType;
      fn(payload);
    });
  }

  /**
   * Set up the listener that will be invoked when the platform sends back the data in response to
   * a send request to {@link GetAllFeederModelsRequest.replyTo}
   * @see {@link MessageRequest.fetchAllFeederModels()}
   * @param fn The listener to invoke when the response message arrives
   */
  onFeederModelsReceived(fn: (payload: GetAllFeederModelsRequestPayload) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._getAllFeederModelsRequest.replyTo, (message: Message) => {
      const payload = JSON.parse(message.body);
      payload.data = JSON.parse(payload.data);
      fn(payload);
    });
  }

  /**
   * Set up the listener that will be invoked when the platform sends back the data in response to
   * a send request to {@link GetTopologyModelRequest.replyTo}
   * @see {@link MessageRequest.fetchTopologyModel(mrid = '')}
   * @param fn The listener to invoke when the response message arrives
   */
  onTopologyModelReceived(fn: (payload: GetTopologyModelRequestPayload) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._getTopologyModelRequest.replyTo, (message: Message) => {
      const payload = JSON.parse(message.body);
      payload.data = JSON.parse(payload.data);
      payload.requestType = this._getTopologyModelRequest.requestBody.configurationType;
      fn(payload);
    });
  }

}