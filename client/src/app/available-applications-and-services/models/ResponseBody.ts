import { Application } from '@client:common/Application';
import { Service } from '@client:common/Service';

/**
 * Represents the response body of the request to retrieve the available applications and services
 */
export interface ResponseBody {
  applications: Application[];
  services: Service[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appInstances: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceInstances: any[];
}
