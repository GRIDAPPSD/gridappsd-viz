import { MessageRequest } from '@shared/MessageRequest';

interface Inputs {
  componentMRID: string;
  simulationId: string;
  manual: boolean;
  differenceMRID: string;
}

export class ToggleRegulatorManualModeRequest implements MessageRequest {
  readonly url: string;
  readonly replyTo = '/topic/goss.gridappsd.simulation.input.regulator';
  readonly requestBody: any;

  constructor(inputs: Inputs) {
    this.url = `/topic/goss.gridappsd.simulation.input.${inputs.simulationId}`;
    this.requestBody = {
      command: 'update',
      input: {
        simulation_id: inputs.simulationId,
        message: {
          timestamp: Math.floor(Date.now() / 1000),
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
