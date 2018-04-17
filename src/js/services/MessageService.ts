import { client, Client, Message, StompSubscription } from '@stomp/stompjs';

import { RUN_CONFIG } from '../../../runConfig';

import { RetrieveAllFeederModelsPayload } from '../models/RetrieveAllFeederModelsPayload';
import { GetAllFeederModelsRequest, GetTopologyModelRequest, GetApplicationsAndServices } from './requests';
import { GetTopologyModelRequestPayload } from '../models/GetTopologyModelRequestPayload';
import { GetApplicationsAndServicesPayload } from '../models/GetApplicationsAndServicesPayload';

// const RESPONSE_QUEUE_TOPIC = '/temp-queue/response-queue';
// const SIMULATION_STATUS_TOPIC = '/topic/goss.gridappsd.simulation.log.';
// const FNCS_OUTPUT_TOPIC = '/topic/goss.gridappsd.fncs.output';

export const STOMP_CLIENT: Client = client(RUN_CONFIG.gossServerUrl);

export class MessageService {

  private static readonly _INSTANCE_: MessageService = new MessageService();
  private _isConnected = false;
  private readonly _getTopologyModelRequest = new GetTopologyModelRequest();
  private readonly _getAllFeederModelsRequest = new GetAllFeederModelsRequest();
  private readonly _getApplicationsAndServices = new GetApplicationsAndServices();

  private constructor() {
    STOMP_CLIENT.heartbeat.outgoing = 0;
    STOMP_CLIENT.heartbeat.incoming = 0;
    STOMP_CLIENT.connect('system', 'manager', () => this._isConnected = true, () => this._isConnected = false);
  }

  static getInstance(): MessageService {
    return MessageService._INSTANCE_;
  }

  isActive(): boolean {
    return this._isConnected;
  }

  retrieveAllFeederModels() {
    STOMP_CLIENT.send(
      this._getAllFeederModelsRequest.url,
      { 'reply-to': this._getAllFeederModelsRequest.url },
      this._getAllFeederModelsRequest.requestBody
    );
  }

  requestApplicationsAndServices() {
    STOMP_CLIENT.send(
      this._getApplicationsAndServices.url,
      { 'reply-to': this._getApplicationsAndServices.url },
      this._getApplicationsAndServices.requestBody
    );
  }

  requestTopologyModel() {
    STOMP_CLIENT.send(
      this._getTopologyModelRequest.url,
      { 'reply-to': this._getTopologyModelRequest.url },
      JSON.stringify(this._getTopologyModelRequest.requestBody)
    );
  }

  onFeederModelsReceived(fn: (payload: RetrieveAllFeederModelsPayload) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._getAllFeederModelsRequest.url, (message: Message) => {
      const payload = JSON.parse(message.body);
      payload.data = JSON.parse(payload.data);
      fn(payload);
    });
  }

  onApplicationsAndServicesReceived(fn: (payload: GetApplicationsAndServicesPayload) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._getApplicationsAndServices.url, (message: Message) => {
      const payload = JSON.parse(message.body);
      fn(payload);
    });
  }

  onTopologyModelReceived(fn: (payload: GetTopologyModelRequestPayload) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._getTopologyModelRequest.url, (message: Message) => {
      const payload = JSON.parse(message.body);
      payload.data = JSON.parse(payload.data);
      fn(payload);
    });
  }

}