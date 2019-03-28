import { TopologyModel } from '@shared/topology';
import { MessageRequest, RequestConfigurationType } from '@shared/MessageRequest';

export class GetTopologyModelRequest implements MessageRequest {

  readonly url = 'goss.gridappsd.process.request.config';
  readonly replyTo = 'topology-model';
  readonly requestBody = {
    configurationType: RequestConfigurationType.GRID_LAB_D_SYMBOLS,
    parameters: {
      model_id: '_4F76A5F9-271D-9EB8-5E31-AA362D86F2C3'
    }
  } as GetTopologyModelRequestBody;

  constructor(lineName) {
    this.requestBody.parameters.model_id = lineName;
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