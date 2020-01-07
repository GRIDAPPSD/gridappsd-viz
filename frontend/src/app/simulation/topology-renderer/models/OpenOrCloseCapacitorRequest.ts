import { MessageRequest } from '@shared/MessageRequest';

interface Inputs {
  componentMRID: string;
  simulationId: string;
  open: boolean;
  differenceMRID: string;
}

export class OpenOrCloseCapacitorRequest implements MessageRequest {
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
          timestamp: Math.floor(Date.now() / 1000.0),
          difference_mrid: inputs.differenceMRID,
          reverse_differences: [
            {
              object: inputs.componentMRID,
              attribute: 'ShuntCompensator.sections',
              value: inputs.open ? 0 : 1
            }
          ],
          forward_differences: [
            {
              object: inputs.componentMRID,
              attribute: 'ShuntCompensator.sections',
              value: inputs.open ? 1 : 0
            }
          ]
        }
      }
    };
  }

}
