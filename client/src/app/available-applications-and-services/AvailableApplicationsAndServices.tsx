import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { TabGroup, Tab } from '@client:common/tabs';

import { ResponseBody } from './models/ResponseBody';
import { ApplicationsTab } from './views/applications-tab/ApplicationsTab';
import { ServicesTab } from './views/services-tab/ServicesTab';
import { ApplicationInstancesTab } from './views/application-instances-tab/ApplicationInstancesTab';
import { ServiceInstancesTab } from './views/service-instances-tab/ServiceInstancesTab';

import './AvailableApplicationsAndServices.light.scss';
import './AvailableApplicationsAndServices.dark.scss';

export interface Props {
  responseBody: ResponseBody;
}

/**
 * Functional component that is rendered when the menu item
 * "Applications and Services" in the drawer is selected.
 *
 * @param props
 */
export function AvailableApplicationsAndServices(props: Props) {
  if (!props.responseBody) {
    return (
      <ProgressIndicator show />
    );
  }

  return (
    <section className='available-applications-and-services'>
      <TabGroup>
        <Tab label='Applications'>
          <ApplicationsTab applications={props.responseBody.applications} />
        </Tab>
        <Tab label='Services'>
          <ServicesTab services={props.responseBody.services} />
        </Tab>
        <Tab label='Application Instances'>
          <ApplicationInstancesTab instances={props.responseBody.appInstances} />
        </Tab>
        <Tab label='Service Instances'>
          <ServiceInstancesTab instances={props.responseBody.serviceInstances} />
        </Tab>
      </TabGroup>
    </section>
  );

}
