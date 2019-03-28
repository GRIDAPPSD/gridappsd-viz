import { MessageRequest } from '@shared/MessageRequest';
import { Application } from '@shared/Application';

interface RequestBody {
  applications: boolean;
  services: boolean;
  appInstances: boolean;
  serviceInstances: boolean;
}

export class GetAvailableApplicationsRequest implements MessageRequest {

  readonly url = 'goss.gridappsd.process.request.status.platform';
  readonly replyTo = 'available-applications';
  readonly requestBody = {
    applications: true,
    services: false,
    appInstances: false,
    serviceInstances: false
  } as RequestBody;

}

export interface GetAvailableApplicationsRequestPayload {
  applications: Application[];
}