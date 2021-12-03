import { MessageRequest } from '@client:common/MessageRequest';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly requestBody: any;

  constructor(inputs: Inputs) {
    this.url = `/topic/goss.gridappsd.simulation.input.${inputs.simulationId}`;
    this.replyTo = `/topic/goss.gridappsd.simulation.input.regulator.${inputs.phase}`;
    this.requestBody = {
      command: 'update',
      input: {
        // eslint-disable-next-line camelcase
        simulation_id: inputs.simulationId,
        message: {
          timestamp: new Date().toISOString(),
          // eslint-disable-next-line camelcase
          difference_mrid: inputs.differenceMRID,
          // eslint-disable-next-line camelcase
          reverse_differences: [],
          // eslint-disable-next-line camelcase
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
