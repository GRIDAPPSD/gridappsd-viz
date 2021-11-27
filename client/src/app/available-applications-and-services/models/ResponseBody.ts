import { Application } from '@client:common/Application';
import { Service } from '@client:common/Service';

export interface ResponseBody {
  applications: Application[];
  services: Service[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appInstances: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceInstances: any[];
}
