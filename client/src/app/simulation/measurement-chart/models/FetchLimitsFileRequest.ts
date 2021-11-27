/* eslint-disable camelcase */
import { CurrentLimit, VoltageLimit } from '@client:common/measurement-limits';
import { MessageRequest, RequestConfigurationType } from '@client:common/MessageRequest';

export class FetchLimitsFileRequest implements MessageRequest {

  readonly url = 'goss.gridappsd.process.request.config';
  readonly requestBody = {
    configurationType: RequestConfigurationType.GRID_LAB_D_LIMITS,
    parameters: {
      simulation_id: ''
    }
  };

  readonly replyTo = '/limits';

  constructor(simulationId: string) {
    this.requestBody.parameters.simulation_id = simulationId;
  }

}

export interface FetchLimitsFileRequestPayload {
  limits: {
    voltages: VoltageLimit[];
    currents: CurrentLimit[];
  };
}
