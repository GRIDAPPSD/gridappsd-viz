import { MessageRequest } from '@shared/MessageRequest';

export class OpenOrCloseCapacitorRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.fncs.input';
  readonly replyTo = '/topic/goss.gridappsd.fncs.input.capacitor';
  readonly requestBody: any;

  constructor(values: { componentMRID: string; simulationId: string; open: boolean, differenceMRID: string; }) {
    this.requestBody = {
      command: 'update',
      input: {
        simulation_id: values.simulationId,
        message: {
          timestamp: Math.floor((new Date).getTime() / 1000.0),
          difference_mrid: values.differenceMRID,
          reverse_differences: [
            {
              object: values.componentMRID,
              attribute: 'ShuntCompensator.sections',
              value: values.open ? '1' : '0'
            }
          ],
          forward_differences: [
            {
              object: values.componentMRID,
              attribute: 'ShuntCompensator.sections',
              value: values.open ? '0' : '1'
            }
          ]
        }
      }
    };
  }

}
