import { MessageRequest } from './MessageRequest';

export class ToggleSwitchStateRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.fncs.input';
  readonly requestBody = '';
  readonly replyTo = '/topic/goss.gridappsd.fncs.input.switch';
}