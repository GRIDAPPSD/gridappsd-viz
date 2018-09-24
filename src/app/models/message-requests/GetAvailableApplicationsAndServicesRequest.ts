import { MessageRequest } from './MessageRequest';
import { Application } from '../Application';

type RequestBody = {
  applications: boolean;
  services: boolean;
  appInstances: boolean;
  serviceInstances: boolean;
}

export class GetAvailableApplicationsAndServices implements MessageRequest {
  private _requestBody: RequestBody = {
    applications: true,
    services: true,
    appInstances: true,
    serviceInstances: true
  };

  get url(): string {
    return 'goss.gridappsd.process.request.status.platform';
  }

  get replyTo(): string {
    return this.url;
  }

  get requestBody(): RequestBody {
    return this._requestBody;
  }
}

export interface GetAvailableApplicationsAndServicesPayload {
  applications: Application[];
  services: string;
  appInstances: string;
  serviceInstances: string;
}