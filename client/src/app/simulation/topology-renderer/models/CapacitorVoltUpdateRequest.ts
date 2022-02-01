import { MessageRequest } from '@client:common/MessageRequest';

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
          timestamp: new Date().toISOString(),
          // eslint-disable-next-line camelcase
          difference_mrid: inputs.differenceMRID,
          // eslint-disable-next-line camelcase
          reverse_differences: [],
          // eslint-disable-next-line camelcase
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
