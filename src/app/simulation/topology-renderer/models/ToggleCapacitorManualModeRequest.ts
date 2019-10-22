import { MessageRequest } from '@shared/MessageRequest';

interface Inputs {
  componentMRID: string;
  simulationId: string;
  manual: boolean;
  differenceMRID: string;
}

export class ToggleCapacitorManualModeRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.fncs.input';
  readonly replyTo = '/topic/goss.gridappsd.fncs.input.capacitor';
  readonly requestBody: any;

  constructor(inputs: Inputs) {
    this.requestBody = {
      command: 'update',
      input: {
        simulation_id: inputs.simulationId,
        message: {
          timestamp: Math.floor((new Date).getTime() / 1000),
          difference_mrid: inputs.differenceMRID,
          reverse_differences: [
            {
              object: inputs.componentMRID,
              attribute: 'RegulatingControl.enabled',
              value: !inputs.manual
            },
            {
              object: inputs.componentMRID,
              attribute: 'RegulatingControlModeKind',
              value: 'RegulatingControlModeKind.voltage'
            }
          ],
          forward_differences: [
            {
              object: inputs.componentMRID,
              attribute: 'RegulatingControl.enabled',
              value: inputs.manual
            },
            {
              object: inputs.componentMRID,
              attribute: 'RegulatingControlModeKind',
              value: 'RegulatingControlModeKind.voltage'
            }
          ]
        }
      }
    };
  }

}
