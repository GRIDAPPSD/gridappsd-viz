import * as React from 'react';

import { NotificationBanner } from '@shared/notification-banner';

import './ApplicationInstancesTab.light.scss';
import './ApplicationInstancesTab.dark.scss';

interface Props {
  instances: any[];
}

export function ApplicationInstancesTab(props: Props) {
  if (!props.instances || props.instances.length === 0)
    return (
      <NotificationBanner persistent>
        No data available
      </NotificationBanner>
    );
  return (
    <div className='application-instances-tab-container'>
      <div className='application-instances-tab'>
        {JSON.stringify(props.instances, null, 4)}
      </div>
    </div>
  );
}
