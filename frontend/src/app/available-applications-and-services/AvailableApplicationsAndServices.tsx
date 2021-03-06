import * as React from 'react';

import { ResponseBody } from './models/ResponseBody';
import { TabGroup, Tab } from '@shared/tabs';
import { ApplicationsTab } from './views/applications-tab/ApplicationsTab';
import { ServicesTab } from './views/services-tab/ServicesTab';
import { ApplicationInstancesTab } from './views/application-instaces-tab/ApplicationInstancesTab';
import { ServiceIntancesTab } from './views/service-instaces-tab/ServiceIntancesTab';
import { ProgressIndicator } from '@shared/overlay/progress-indicator';

import './AvailableApplicationsAndServices.light.scss';
import './AvailableApplicationsAndServices.dark.scss';

export interface Props {
  responseBody: ResponseBody;
}

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
          <ServiceIntancesTab instances={props.responseBody.serviceInstances} />
        </Tab>
      </TabGroup>
    </section>
  );

}
