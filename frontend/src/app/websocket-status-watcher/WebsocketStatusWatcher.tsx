import * as React from 'react';

import { StompClientConnectionStatus } from '@shared/StompClientService';
import { MessageBanner } from '@shared/overlay/message-banner';
import { ThreeDots } from '@shared/three-dots';
import { PortalRenderer } from '@shared/overlay/portal-renderer';

import './WebsocketStatusWatcher.light.scss';
import './WebsocketStatusWatcher.dark.scss';

interface Props {
  websocketStatus: StompClientConnectionStatus;
}

export function WebsocketStatusWatcher(props: Props) {
  switch (props.websocketStatus) {
    case StompClientConnectionStatus.DISCONNECTED:
      return (
        <PortalRenderer containerClassName='websocket-status-watcher-container'>
          <MessageBanner>
            <span>
              <span>Connection to server was lost,</span>
              <br />
              <span>you will be logged out in 3 seconds</span>
              <ThreeDots />
            </span>
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
