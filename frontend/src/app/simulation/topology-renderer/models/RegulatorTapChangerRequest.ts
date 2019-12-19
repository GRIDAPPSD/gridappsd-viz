import { MessageRequest } from '@shared/MessageRequest';

interface Inputs {
  mRID: string;
  simulationId: string;
  differenceMRID: string;
  tapValue: number;
  phase: string;
}

export class RegulatorTapChangerRequest implements MessageRequest {

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
              attribute: 'TapChanger.step',
              value: inputs.tapValue
            }
          ]
        }
      }
    };
  }

}
