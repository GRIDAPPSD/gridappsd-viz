import * as React from 'react';

import { PortalRenderer } from '@shared/portal-renderer';
import { IconButton } from '@shared/buttons';

import './NewAlarmNotification.scss';

interface Props {
  newAlarmCounts: number;
  onConfirm: () => void;
}

export function NewAlarmNotification(props: Props) {
  return (
    <PortalRenderer>
      <div className='new-alarm-notification-container'>
        <div className={`new-alarm-notification ${props.newAlarmCounts > 0 ? 'show' : 'hide'}`}>
          <IconButton
            icon='notifications'
            size='large'
            style='accent'
            onClick={props.onConfirm} />
          <div className='new-alarm-notification__counts'>
            {props.newAlarmCounts}
          </div>
        </div>
      </div>
    </PortalRenderer>
  );
}
