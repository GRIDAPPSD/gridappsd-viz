import { MessageRequest } from '@shared/MessageRequest';

export class CapacitorVoltUpdateRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.fncs.input';
  readonly replyTo = '/topic/goss.gridappsd.fncs.input.capacitor';
  readonly requestBody: any;

  constructor(values: { componentMRID: string; simulationId: string; target: string; deadband: string; differenceMRID: string; }) {
    this.requestBody = {
      command: 'update',
      input: {
        simulation_id: values.simulationId,
        message: {
          timestamp: new Date().toISOString(),
          difference_mrid: values.differenceMRID,
          reverse_differences: [],
          forward_differences: [
            {
              object: values.componentMRID,
              attribute: 'RegulatingControl.mode',
              value: '2'
            },
            {
              object: values.componentMRID,
              attribute: 'RegulatingControl.targetValue',
              value: values.target
            },
            {
              object: values.componentMRID,
              attribute: 'RegulatingControl.targetDeadband',
              value: values.deadband
            }
          ]
        }
      }
    };
  }

}
