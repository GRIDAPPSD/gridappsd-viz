import * as React from 'react';

import { NotificationBanner } from '@shared/notification-banner';

import './ServiceIntancesTab.light.scss';
import './ServiceIntancesTab.dark.scss';

interface Props {
  instances: any[];
}

export function ServiceIntancesTab(props: Props) {
  if (!props.instances || props.instances.length === 0)
    return (
      <NotificationBanner persistent>
        No data available
      </NotificationBanner>
    );
  return (
    <div className='service-instances-tab-container'>
      <div className='service-instances-tab'>
        {JSON.stringify(props.instances, null, 4)}
      </div>
    </div>
  );
}
