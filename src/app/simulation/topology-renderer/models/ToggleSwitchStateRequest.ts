import { MessageRequest } from '@shared/MessageRequest';

interface Inputs {
  componentMRID: string;
  simulationId: string;
  open: boolean;
  differenceMRID: string;
}

export class ToggleSwitchStateRequest implements MessageRequest {
  readonly url: string;
  readonly replyTo = '/topic/goss.gridappsd.simulation.input.switch';
  readonly requestBody: any;

  constructor(inputs: Inputs) {
    this.url = `/topic/goss.gridappsd.simulation.input.${inputs.simulationId}`;
    this.requestBody = {
      command: 'update',
      input: {
        simulation_id: inputs.simulationId,
        message: {
          timestamp: Math.floor(Date.now() / 1000.0),
          difference_mrid: inputs.differenceMRID,
          reverse_differences: [
            {
              object: inputs.componentMRID,
              value: inputs.open ? 0 : 1,
              attribute: 'Switch.open'
            }
          ],
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
