import { MessageRequest } from '@shared/MessageRequest';
import { Application } from '@shared/Application';
import { Service } from '@shared/Service';

interface RequestBody {
  applications: boolean;
  services: boolean;
  appInstances: boolean;
  serviceInstances: boolean;
}

export class GetAvailableApplicationsAndServicesRequest implements MessageRequest {

  readonly url = 'goss.gridappsd.process.request.status.platform';
  readonly replyTo = 'available-applications-and-services';
  readonly requestBody: RequestBody = {
    applications: true,
    services: true,
    appInstances: false,
    serviceInstances: false
  };

}

export interface GetAvailableApplicationsRequestPayload {
  applications: Application[];
  services: Service[];
}
