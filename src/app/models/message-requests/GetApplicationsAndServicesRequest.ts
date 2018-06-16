import { MessageRequest } from './MessageRequest';

export class GetApplicationsAndServices implements MessageRequest {
  get url(): string {
    return 'goss.gridappsd.process.request.status.platform';
  }

  get replyTo(): string {
    return this.url;
  }
  
  get requestBody(): string {
    return `{"applications":true,"services": true,"appInstances":true,"serviceInstances":true}`;
  }
}

export interface GetApplicationsAndServicesPayload {
  applications: string;
  services: string;
  appInstances: string;
  serviceInstances: string;
}