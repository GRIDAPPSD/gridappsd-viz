import { Application } from '@shared/Application';
import { Service } from '@shared/Service';

export interface Payload {
  applications: Application[];
  services: Service[];
  appInstances: any[];
  serviceInstances: any[];
}
