import { MessageRequest } from '@client:common/MessageRequest';

interface Inputs {
  componentMRID: string;
  simulationId: string;
  open: boolean;
  differenceMRID: string;
}

export class ToggleSwitchStateRequest implements MessageRequest {
  readonly url: string;
  readonly replyTo = '/topic/goss.gridappsd.simulation.input.switch';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly requestBody: any;

  constructor(inputs: Inputs) {
    this.url = `/topic/goss.gridappsd.simulation.input.${inputs.simulationId}`;
    this.requestBody = {
      command: 'update',
      input: {
        // eslint-disable-next-line camelcase
        simulation_id: inputs.simulationId,
        message: {
          timestamp: Math.floor(Date.now() / 1000.0),
          // eslint-disable-next-line camelcase
          difference_mrid: inputs.differenceMRID,
          // eslint-disable-next-line camelcase
          reverse_differences: [
            {
              object: inputs.componentMRID,
              value: inputs.open ? 0 : 1,
              attribute: 'Switch.open'
            }
          ],
          // eslint-disable-next-line camelcase
          forward_differences: [
            {
              object: inputs.componentMRID,
              value: inputs.open ? 1 : 0,
              attribute: 'Switch.open'
            }
          ]
        }
      }
    };
  }

}
