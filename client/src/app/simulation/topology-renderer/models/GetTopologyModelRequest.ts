import { TopologyModel } from '@client:common/topology';
import { MessageRequest } from '@client:common/MessageRequest';

export class GetTopologyModelRequest implements MessageRequest {

  readonly url = 'goss.gridappsd.process.request.config';
  readonly replyTo = 'topology-model';
  readonly requestBody = {
    configurationType: 'GridLAB-D Symbols',
    parameters: {
      // eslint-disable-next-line camelcase
      model_id: '_4F76A5F9-271D-9EB8-5E31-AA362D86F2C3'
    }
  } as GetTopologyModelRequestBody;

  constructor(lineName: string) {
    // eslint-disable-next-line camelcase
    this.requestBody.parameters.model_id = lineName;
  }

}


export interface GetTopologyModelRequestBody {
  configurationType: string;
  parameters: {
    // eslint-disable-next-line camelcase
    model_id: string;
  };
}

export interface GetTopologyModelRequestPayload {
  data: TopologyModel;
  id: string;
  responseComplete: boolean;
  requestType: string;
}
