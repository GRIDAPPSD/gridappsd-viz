import { Message, StompSubscription } from '@stomp/stompjs';

import { StompClient } from './StompClient';

import { GetAllFeederModelsRequest, GetAllFeederModelsRequestPayload } from '../models/message-requests/GetAllFeederModelsRequest';
import { GetTopologyModelRequest, GetTopologyModelRequestPayload } from '../models/message-requests/GetTopologyModelRequest';
import { GetModelDictionaryRequest } from '../models/message-requests/GetModelDictionaryRequest';
import { ModelDictionary } from '../models/model-dictionary/ModelDictionary';
import { QueryBlazeGraphRequest, QueryBlazeGraphRequestBody } from '../models/message-requests/QueryBlazeGraphRequest';
import { GetApplicationsAndServices, GetApplicationsAndServicesPayload } from '../models/message-requests/GetApplicationsAndServicesRequest';

export class MessageService {

  private readonly _stompClient = StompClient.getInstance();
  private static readonly _INSTANCE_: MessageService = new MessageService();
  private readonly _getTopologyModelRequest = new GetTopologyModelRequest();
  private readonly _getAllFeederModelsRequest = new GetAllFeederModelsRequest();
  private readonly _getModelDictionaryRequest = new GetModelDictionaryRequest();
  private readonly _queryBlazeGraphRequest = new QueryBlazeGraphRequest();
  private readonly _getApplicationsAndServices = new GetApplicationsAndServices();
  private readonly _modelDictionaryCache = {};
  private readonly _topologyModelCache = {};

  private constructor() {
  }

  static getInstance(): MessageService {
    return MessageService._INSTANCE_;
  }

  /**
   * Returns whether the connection between the stomp client and the backend
   * has been established
   */
  isActive(): boolean {
    return this._stompClient.isActive();
  }

  fetchApplicationsAndServices() {
    this._stompClient.send(
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
    this._stompClient.send(
      this._getAllFeederModelsRequest.url,
      { 'reply-to': this._getAllFeederModelsRequest.replyTo },
      this._getAllFeederModelsRequest.requestBody
    );
  }

  /**
   * Send a request to the platform request the model dictionary
   * Start sending when Line name drowndown meny in simulation config form is changed
   * @param mrid The MRID for which to request the model dictionary
   * @see {@link MessageRequest.onModelDictionaryReceived(fn: (payload: ModelDictionary) => void)}
   */
  fetchModelDictionary(mrid: string) {
    if (mrid in this._modelDictionaryCache)
      return;
    this._modelDictionaryCache[mrid] = true;
    this._getModelDictionaryRequest.requestBody.parameters.model_id = mrid;
    this._stompClient.send(
      this._getModelDictionaryRequest.url,
      { 'reply-to': this._getModelDictionaryRequest.replyTo },
      JSON.stringify(this._getModelDictionaryRequest.requestBody)
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
    this._stompClient.send(
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
  fetchTopologyModel(mrid: string) {
    if (mrid in this._topologyModelCache)
      return;
    this._topologyModelCache[mrid] = true;
    this._getTopologyModelRequest.requestBody.parameters.model_id = mrid;
    this._stompClient.send(
      this._getTopologyModelRequest.url,
      { 'reply-to': this._getTopologyModelRequest.replyTo },
      JSON.stringify(this._getTopologyModelRequest.requestBody)
    );
  }

  onApplicationsAndServicesReceived(fn: (payload: GetApplicationsAndServicesPayload) => void): StompSubscription {
    return this._stompClient.subscribe(this._getApplicationsAndServices.url, (message: Message) => {
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
    return this._stompClient.subscribe(this._queryBlazeGraphRequest.replyTo, (message: Message) => {
      fn(JSON.parse(message.body));
    });
  }

  /**
   * Set up the listener that will be invoked when the platform sends back the data in response to
   * a send request to {@link GetTopologyModelRequest.replyTo}
   * @see {@link MessageRequest.fetchModelDictionary(mrid = '')}
   * @param fn The listener to invoke when the response message arrives
   */
  onModelDictionaryReceived(fn: (payload: ModelDictionary) => void): StompSubscription {
    return this._stompClient.subscribe(this._getModelDictionaryRequest.replyTo, (message: Message) => {
      const payload = JSON.parse(message.body);
      // payload.data = JSON.parse(payload.data);
      payload.requestType = this._getModelDictionaryRequest.requestBody.configurationType;
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
    return this._stompClient.subscribe(this._getAllFeederModelsRequest.replyTo, (message: Message) => {
      const payload = JSON.parse(message.body);
      // payload.data = JSON.parse(payload.data);
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
    return this._stompClient.subscribe(this._getTopologyModelRequest.replyTo, (message: Message) => {
      const payload = JSON.parse(message.body);
      // payload.data = JSON.parse(payload.data);
      payload.requestType = this._getTopologyModelRequest.requestBody.configurationType;
      fn(payload);
    });
  }

}