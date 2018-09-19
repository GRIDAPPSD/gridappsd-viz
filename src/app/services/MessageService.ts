import { Message, StompSubscription } from '@stomp/stompjs';

import { StompClientService } from './StompClientService';
import { GetAllFeederModelsRequest, GetAllFeederModelsRequestPayload } from '../models/message-requests/GetAllFeederModelsRequest';
import { GetTopologyModelRequest, GetTopologyModelRequestPayload } from '../models/message-requests/GetTopologyModelRequest';
import { GetModelDictionaryRequest } from '../models/message-requests/GetModelDictionaryRequest';
import { ModelDictionary } from '../models/model-dictionary/ModelDictionary';
import { QueryBlazeGraphRequest, QueryBlazeGraphRequestBody } from '../models/message-requests/QueryBlazeGraphRequest';
import { GetAvailableApplicationsAndServices, GetAvailableApplicationsAndServicesPayload } from '../models/message-requests/GetAvailableApplicationsAndServicesRequest';
import { ToggleSwitchStateRequest } from '../models/message-requests/ToggleSwitchStateRequest';

export class MessageService {

  private readonly _stompClient = StompClientService.getInstance();
  private static readonly _INSTANCE_: MessageService = new MessageService();
  private readonly _getTopologyModelRequest = new GetTopologyModelRequest();
  private readonly _getAllFeederModelsRequest = new GetAllFeederModelsRequest();
  private readonly _getModelDictionaryRequest = new GetModelDictionaryRequest();
  private readonly _queryBlazeGraphRequest = new QueryBlazeGraphRequest();
  private readonly _getApplicationsAndServices = new GetAvailableApplicationsAndServices();
  private readonly _toggleSwitchStateRequest = new ToggleSwitchStateRequest();
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

  fetchAvailableApplicationsAndServices(onlyFetchApplications = false) {
    this._getApplicationsAndServices.requestBody.services = !onlyFetchApplications;
    this._getApplicationsAndServices.requestBody.appInstances = !onlyFetchApplications;
    this._getApplicationsAndServices.requestBody.serviceInstances = !onlyFetchApplications;
    this._stompClient.send(
      this._getApplicationsAndServices.url,
      { 'reply-to': this._getApplicationsAndServices.url },
      JSON.stringify(this._getApplicationsAndServices.requestBody)
    );
  }

  /**
   * Send a request to the topic requesting all the feeders to populate the simulation
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
   * Send a request to the platform requesting the model dictionary
   * Start sending when Line name drowndown menu in simulation config form is changed
   * @param mrid The MRID for which to request the model dictionary
   * @see {@link MessageRequest.onModelDictionaryReceived(fn: (payload: ModelDictionary) => void)}
   */
  fetchModelDictionary(mrid: string, simulationName: string) {
    if (mrid in this._modelDictionaryCache)
      return;
    this._modelDictionaryCache[mrid] = true;
    this._getModelDictionaryRequest.requestBody.parameters.model_id = mrid;
    this._getModelDictionaryRequest.simulationName = simulationName;
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

  onApplicationsAndServicesReceived(fn: (payload: GetAvailableApplicationsAndServicesPayload) => void): StompSubscription {
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
  onModelDictionaryReceived(fn: (response: { payload: ModelDictionary; requestType: string }, simulationName) => void): StompSubscription {
    return this._stompClient.subscribe(this._getModelDictionaryRequest.replyTo, (message: Message) => {
      fn({
        payload: JSON.parse(message.body) as ModelDictionary,
        requestType: this._getModelDictionaryRequest.requestBody.configurationType
      }, this._getModelDictionaryRequest.simulationName);
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
      payload.requestType = this._getTopologyModelRequest.requestBody.configurationType;
      fn(payload);
    });
  }

  toggleSwitchState(payload) {
    this._stompClient.send(
      this._toggleSwitchStateRequest.url,
      { 'reply-to': this._toggleSwitchStateRequest.replyTo },
      JSON.stringify(payload)
    );
  }

}