/* eslint-disable camelcase */
import { CurrentLimit, VoltageLimit } from '@client:common/measurement-limits';
import { MessageRequest } from '@client:common/MessageRequest';

export class FetchLimitsFileRequest implements MessageRequest {

  readonly url = 'goss.gridappsd.process.request.config';
  readonly requestBody = {
    configurationType: 'GridLAB-D Limits',
    parameters: {
      simulation_id: '',
      model_id: ''
    }
  };

  readonly replyTo = '/limits';

  constructor(simulationId: string, modelId: string) {
    this.requestBody.parameters.simulation_id = simulationId;
    this.requestBody.parameters.model_id = modelId;
  }

}

export interface FetchLimitsFileRequestPayload {
  limits: {
    voltages: VoltageLimit[];
    currents: CurrentLimit[];
  };
}
