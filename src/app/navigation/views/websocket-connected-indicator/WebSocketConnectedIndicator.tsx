import * as React from 'react';

import { StompClientConnectionStatus } from '@shared/StompClientService';

import './WebSocketConnectedIndicator.scss';

interface Props {
  websocketStatus: StompClientConnectionStatus;
}

export function WebSocketConnectedIndicator(props: Props) {
  if (props.websocketStatus === 'CONNECTED')
    return (
      <section className='websocket-connected-indicator'>
        <i className='material-icons websocket-connected-indicator__icon'>import_export</i>
        <div className='websocket-connected-indicator__status-text'>Connected</div>
      </section>
    );
  return null;
}
