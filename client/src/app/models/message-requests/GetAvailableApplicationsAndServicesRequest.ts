import { Application } from '@client:common/Application';
import { Service } from '@client:common/Service';
import { MessageRequest } from '@client:common/MessageRequest';

interface RequestBody {
  applications: boolean;
  services: boolean;
  appInstances: boolean;
  serviceInstances: boolean;
  field: boolean;
}

export class GetAvailableApplicationsAndServicesRequest implements MessageRequest {

  readonly url = 'goss.gridappsd.process.request.status.platform';
  readonly replyTo = 'available-applications-and-services';
  readonly requestBody: RequestBody = {
    applications: true,
    services: true,
    appInstances: false,
    serviceInstances: false,
    field: true
  };

}

export interface GetAvailableApplicationsRequestPayload {
  applications: Application[];
  services: Service[];
}
