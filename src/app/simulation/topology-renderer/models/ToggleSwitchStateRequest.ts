import { MessageRequest } from '@shared/MessageRequest';

interface Inputs {
  componentMRID: string;
  simulationId: string;
  open: boolean;
  differenceMRID: string;
}

export class ToggleSwitchStateRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.fncs.input';
  readonly replyTo = '/topic/goss.gridappsd.fncs.input.switch';
  readonly requestBody: any;

  constructor(inputs: Inputs) {
    this.requestBody = {
      command: 'update',
      input: {
        simulation_id: inputs.simulationId,
        message: {
          timestamp: Math.floor((new Date).getTime() / 1000.0),
          difference_mrid: inputs.differenceMRID,
          // Previous value
          reverse_differences: [
            {
              object: inputs.componentMRID,
              // Open is 0
              // Closed is 1
              value: inputs.open ? 1 : 0,
              attribute: 'Switch.open'
            }
          ],
          // Current value
          forward_differences: [
            {
              object: inputs.componentMRID,
              value: inputs.open ? 0 : 1,
              attribute: 'Switch.open'
            }
          ]
        }
      }
    };
  }

}
