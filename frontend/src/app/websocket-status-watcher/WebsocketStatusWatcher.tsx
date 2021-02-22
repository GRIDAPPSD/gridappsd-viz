import * as React from 'react';

import { StompClientConnectionStatus } from '@shared/StompClientService';
import { MessageBanner } from '@shared/overlay/message-banner';
import { ThreeDots } from '@shared/three-dots';
import { PortalRenderer } from '@shared/overlay/portal-renderer';
import { IconButton } from '@shared/buttons';

import './WebsocketStatusWatcher.light.scss';
import './WebsocketStatusWatcher.dark.scss';

interface Props {
  websocketStatus: StompClientConnectionStatus;
  onReconnect: () => void;
}

export function WebsocketStatusWatcher(props: Props) {
  switch (props.websocketStatus) {
    case StompClientConnectionStatus.DISCONNECTED:
      return (
        <PortalRenderer containerClassName='websocket-status-watcher-container'>
          <MessageBanner>
            <span>
              Unable to establish a connection
            </span>
            <br />
            <span style={{ fontSize: '30px', marginRight: 10 }}>
              Check server or
            </span>
            <IconButton
              icon='cached'
              rounded={false}
              onClick={props.onReconnect}
              label='Click to reconnect' />
          </MessageBanner>
        </PortalRenderer>
      );

    case StompClientConnectionStatus.CONNECTING:
      return (
        <PortalRenderer containerClassName='websocket-status-watcher-container'>
          <MessageBanner>
            <span>
              <span>Trying to connect to server</span>
              <ThreeDots />
            </span>
          </MessageBanner>
        </PortalRenderer>
      );
  }
  return null;
}
