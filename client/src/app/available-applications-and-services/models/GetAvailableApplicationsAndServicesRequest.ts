import { MessageRequest } from '@client:common/MessageRequest';

/**
 * Represents the request to retrieve all the available applications and services.
 */
export class GetAvailableApplicationsAndServicesRequest implements MessageRequest {

  private readonly _requestBody = {
    applications: true,
    services: true,
    appInstances: true,
    serviceInstances: true
  };

  get url(): string {
    return 'goss.gridappsd.process.request.status.platform';
  }

  get replyTo(): string {
    return 'application-and-services';
  }

  get requestBody() {
    return this._requestBody;
  }
}
