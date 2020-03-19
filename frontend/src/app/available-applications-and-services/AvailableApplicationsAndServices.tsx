import * as React from 'react';

import { Payload } from './models/Payload';
import { TabGroup, Tab } from '@shared/tabs';
import { ApplicationsTab } from './views/applications-tab/ApplicationsTab';
import { ServicesTab } from './views/services-tab/ServicesTab';
import { ApplicationInstancesTab } from './views/application-instaces-tab/ApplicationInstancesTab';
import { ServiceIntancesTab } from './views/service-instaces-tab/ServiceIntancesTab';
import { ProgressIndicator } from '@shared/overlay/progress-indicator';

import './AvailableApplicationsAndServices.light.scss';
import './AvailableApplicationsAndServices.dark.scss';

export interface Props {
  payload: Payload;
}

export function AvailableApplicationsAndServices(props: Props) {
  if (!props.payload) {
    return (
      <ProgressIndicator show />
    );
  }

  return (
    <section className='available-applications-and-services'>
      <TabGroup>
        <Tab label='Applications'>
          <ApplicationsTab applications={props.payload.applications} />
        </Tab>
        <Tab label='Services'>
          <ServicesTab services={props.payload.services} />
        </Tab>
        <Tab label='Application Instances'>
          <ApplicationInstancesTab instances={props.payload.appInstances} />
        </Tab>
        <Tab label='Service Instances'>
          <ServiceIntancesTab instances={props.payload.serviceInstances} />
        </Tab>
      </TabGroup>
    </section>
  );

}
