
import { PortalRenderer } from '@client:common/overlay/portal-renderer';

import './NewAlarmNotification.light.scss';
import './NewAlarmNotification.dark.scss';

interface Props {
  newAlarmCounts: number;
  onConfirm: () => void;
}

export function NewAlarmNotification(props: Props) {
  const style: React.CSSProperties = {
    left: undefined,
    top: undefined,
    width: 0,
    height: 0,
    pointerEvents: props.newAlarmCounts === 0 ? 'none' : 'all'
  };
  const alarmsTab = document.querySelector('.tab-group__header__label.tab-label-3');
  if (alarmsTab) {
    const boundingBox = alarmsTab.getBoundingClientRect();
    style.left = boundingBox.left;
    style.top = boundingBox.top;
    style.width = boundingBox.width;
    style.height = boundingBox.height;
  }
  return (
    <PortalRenderer>
      <div className='new-alarm-notification-container'>
        <div
          className='new-alarm-notification'
          style={style}
          onClick={props.onConfirm}>
          <div className={`new-alarm-notification__counts ${props.newAlarmCounts > 0 ? 'visible' : 'hidden'}`}>
            {props.newAlarmCounts}
          </div>
        </div>
      </div>
    </PortalRenderer>
  );
}
