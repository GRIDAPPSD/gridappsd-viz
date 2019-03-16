import { MessageRequest } from '@shared/MessageRequest';

export class ToggleCapacitorManualModeRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.fncs.input';
  readonly replyTo = '/topic/goss.gridappsd.fncs.input.capacitor';
  readonly requestBody: any;

  constructor(values: { componentMRID: string; simulationId: string, manual: boolean, differenceMRID: string; }) {
    this.requestBody = {
      simulation_id: values.simulationId,
      message: {
        timestamp: Math.floor((new Date).getTime() / 1000),
        difference_mrid: values.differenceMRID,
        reverse_differences: [
          {
            object: values.componentMRID,
            attribute: 'RegulatingControl.enabled',
            value: values.manual ? 'false' : 'true'
          },
          {
            object: values.componentMRID,
            attribute: 'RegulatingControlModeKind',
            value: 'RegulatingControlModeKind.voltage'
          }
        ],
        forward_differences: [
          {
            object: values.componentMRID,
            attribute: 'RegulatingControl.enabled',
            value: values.manual ? 'true' : 'false'
          },
          {
            object: values.componentMRID,
            attribute: 'RegulatingControlModeKind',
            value: 'RegulatingControlModeKind.voltage'
          }
        ]
      }
    };
  }

}