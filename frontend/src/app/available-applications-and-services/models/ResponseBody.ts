import { Application } from '@shared/Application';
import { Service } from '@shared/Service';

export interface ResponseBody {
  applications: Application[];
  services: Service[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appInstances: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceInstances: any[];
}
