import { MessageRequest } from '@shared/MessageRequest';

interface Inputs {
  mRID: string;
  simulationId: string;
  differenceMRID: string;
  lineDropX: number;
  lineDropR: number;
  phase: string;
}

export class RegulatorLineDropUpdateRequest implements MessageRequest {

  readonly url: string;
  readonly replyTo: string;
  readonly requestBody: any;

  constructor(inputs: Inputs) {
    this.url = `/topic/goss.gridappsd.simulation.input.${inputs.simulationId}`;
    this.replyTo = `/topic/goss.gridappsd.simulation.input.regulator.${inputs.phase}`;
    this.requestBody = {
      command: 'update',
      input: {
        simulation_id: inputs.simulationId,
        message: {
          timestamp: new Date().toISOString(),
          difference_mrid: inputs.differenceMRID,
          reverse_differences: [],
          forward_differences: [
            {
              object: inputs.mRID,
              attribute: 'TapChanger.lineDropCompensation',
              value: true
            },
            {
              object: inputs.mRID,
              attribute: 'TapChanger.lineDropR',
              value: inputs.lineDropR
            },
            {
              object: inputs.mRID,
              attribute: 'TapChanger.lineDropX',
              value: inputs.lineDropX
            }
          ]
        }
      }
    };
  }

}
