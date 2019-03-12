import { MessageRequest } from '@shared/MessageRequest';

export class ToggleSwitchStateRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.fncs.input';
  readonly replyTo = '/topic/goss.gridappsd.fncs.input.switch';

  constructor(readonly requestBody: any) {

  }
}