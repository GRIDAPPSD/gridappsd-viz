import { MessageRequest } from '@shared/MessageRequest';

interface Inputs {
  componentMRID: string;
  simulationId: string;
  target: number;
  deadband: number;
  differenceMRID: string;
}

export class CapacitorVoltUpdateRequest implements MessageRequest {
  readonly url: string;
  readonly replyTo = '/topic/goss.gridappsd.simulation.input.capacitor';
  readonly requestBody: any;

  constructor(inputs: Inputs) {
    this.url = `/topic/goss.gridappsd.simulation.input.${inputs.simulationId}`;
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
              value: 2
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
