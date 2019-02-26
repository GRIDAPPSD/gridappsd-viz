import { MessageRequest } from './MessageRequest';
import { RequestConfigurationType } from './RequestConfigurationType';
import { TopologyModel } from '@shared/topology';

export class GetTopologyModelRequest implements MessageRequest {
  private _requestBody: GetTopologyModelRequestBody = null;

  constructor() {
    this._requestBody = {
      configurationType: RequestConfigurationType.GRID_LAB_D_SYMBOLS,
      parameters: {
        model_id: '_4F76A5F9-271D-9EB8-5E31-AA362D86F2C3'
      }
    };
  }

  get url(): string {
    return 'goss.gridappsd.process.request.config';
  }

  get replyTo(): string {
    return `topology-model`;
  }

  get requestBody(): GetTopologyModelRequestBody {
    return this._requestBody;
  }

  set requestBody(value: GetTopologyModelRequestBody) {
    this._requestBody = value;
  }
}


export interface GetTopologyModelRequestBody {
  configurationType: string;
  parameters: {
    model_id: string;
  };
}

export interface GetTopologyModelRequestPayload {
  data: TopologyModel;
  id: string;
  responseComplete: boolean;
  requestType: string;
}