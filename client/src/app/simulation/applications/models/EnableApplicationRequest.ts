import { MessageRequest } from '@shared/MessageRequest';
import { Application } from '@shared/Application';

export class EnableApplicationRequest implements MessageRequest {

  readonly url: string;
  readonly requestBody: {
    command: 'no-op';
    message: 'enable';
  };

  readonly replyTo: string;

  constructor(application: Application, simulationId: string) {
    this.url = `goss.gridappsd.simulation.${application.id}.${simulationId}.input`;
    this.requestBody = {
      command: 'no-op',
      message: 'enable'
    };
    this.replyTo = 'enable-application';
  }

}
