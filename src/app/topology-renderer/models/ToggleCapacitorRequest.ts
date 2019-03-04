import { MessageRequest } from '../../models/message-requests/MessageRequest';

export class ToggleCapacitorRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.simulation.input';
  readonly replyTo = '/topic/goss.gridappsd.simulation.input.capacitor';
  constructor(readonly requestBody: any) {

  }

}