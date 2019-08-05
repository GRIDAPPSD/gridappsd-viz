import { MessageRequest } from '@shared/MessageRequest';
import { Application } from '@shared/Application';

export class DisableApplicationRequest implements MessageRequest {

  readonly url: string;
  readonly requestBody: any;
  readonly replyTo: string;

  constructor(application: Application, simulationId: string) {
    this.url = `goss.gridappsd.simulation.${application.id}.${simulationId}.input`;
    this.requestBody = {
      command: 'no-op',
      message: 'disable'
    };
    this.replyTo = 'dis-application';
  }

}
