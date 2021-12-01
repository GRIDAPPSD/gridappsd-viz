import { MessageBanner } from '@client:common/overlay/message-banner';

import './ServiceInstancesTab.light.scss';
import './ServiceInstancesTab.dark.scss';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instances: any[];
}

export function ServiceInstancesTab(props: Props) {
  if (!props.instances || props.instances.length === 0) {
    return (
      <MessageBanner>
        No data available
      </MessageBanner>
    );
  }
  return (
    <div className='service-instances-tab-container'>
      <div className='service-instances-tab'>
        {JSON.stringify(props.instances, null, 4)}
      </div>
    </div>
  );
}