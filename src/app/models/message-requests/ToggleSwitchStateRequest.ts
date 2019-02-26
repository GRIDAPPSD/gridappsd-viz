import { MessageRequest } from './MessageRequest';

export class ToggleSwitchStateRequest implements MessageRequest {
  readonly url = '/topic/goss.gridappsd.simulation.input';
  readonly requestBody = '';
  readonly replyTo = '/topic/goss.gridappsd.simulation.input.switch';
}