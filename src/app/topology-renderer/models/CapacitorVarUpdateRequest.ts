import { MessageRequest } from '@shared/MessageRequest';

interface Inputs {
  componentMRID: string;
  simulationId: string;
  target: number;
  deadband: number;
  differenceMRID: string;
}

export class CapacitorVarUpdateRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.fncs.input';
  readonly replyTo = '/topic/goss.gridappsd.fncs.input.capacitor';
  readonly requestBody: any;

  constructor(inputs: Inputs) {
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
              object: inputs.componentMRID,
              attribute: 'RegulatingControl.mode',
              value: 0
            },
            {
              object: inputs.componentMRID,
              attribute: 'RegulatingControl.targetValue',
              value: inputs.target
            },
            {
              object: inputs.componentMRID,
              attribute: 'RegulatingControl.targetDeadband',
              value: inputs.deadband
            }
          ]
        }
      }
    };
  }

}
