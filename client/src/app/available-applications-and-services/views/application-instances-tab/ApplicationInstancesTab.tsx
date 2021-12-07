import { MessageBanner } from '@client:common/overlay/message-banner';

import './ApplicationInstancesTab.light.scss';
import './ApplicationInstancesTab.dark.scss';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  instances: any[];
}

/**
 * Functional component for the "Application Instances" tab
 * which is shown when the menu item "Applications & Services" is selected.
 *
 * @param props
 */
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
