import { Application } from '@client:common/Application';
import { MessageRequest } from '@client:common/MessageRequest';

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
