import * as React from 'react';

import { MessageBanner } from '@shared/message-banner';

import './ServiceIntancesTab.light.scss';
import './ServiceIntancesTab.dark.scss';

interface Props {
  instances: any[];
}

export function ServiceIntancesTab(props: Props) {
  if (!props.instances || props.instances.length === 0)
    return (
      <MessageBanner>
        No data available
      </MessageBanner>
    );
  return (
    <div className='service-instances-tab-container'>
      <div className='service-instances-tab'>
        {JSON.stringify(props.instances, null, 4)}
      </div>
    </div>
  );
}
