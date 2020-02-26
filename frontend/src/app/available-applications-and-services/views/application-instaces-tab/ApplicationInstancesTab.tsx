import * as React from 'react';

import { MessageBanner } from '@shared/overlay/message-banner';

import './ApplicationInstancesTab.light.scss';
import './ApplicationInstancesTab.dark.scss';

interface Props {
  instances: any[];
}

export function ApplicationInstancesTab(props: Props) {
  if (!props.instances || props.instances.length === 0) {
    return (
      <MessageBanner>
        No data available
      </MessageBanner>
    );
  }
  return (
    <div className='application-instances-tab-container'>
      <div className='application-instances-tab'>
        {JSON.stringify(props.instances, null, 4)}
      </div>
    </div>
  );
}
