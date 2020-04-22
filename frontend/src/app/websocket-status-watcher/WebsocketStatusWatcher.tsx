import * as React from 'react';
import { Subscription } from 'rxjs';

import { IconButton } from '@shared/buttons';
import { StompClientConnectionStatus, StompClientService } from '@shared/StompClientService';
import { MessageBanner } from '@shared/overlay/message-banner';
import { ThreeDots } from '@shared/three-dots';
import { PortalRenderer } from '@shared/overlay/portal-renderer';

import './WebsocketStatusWatcher.light.scss';
import './WebsocketStatusWatcher.dark.scss';

interface Props {
}

interface State {
  websocketStatus: StompClientConnectionStatus;
}

export class WebsocketStatusWatcher extends React.Component<Props, State> {

  readonly stompClientService = StompClientService.getInstance();

  private _websocketStatusStream: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      websocketStatus: this.stompClientService.isActive() ? StompClientConnectionStatus.CONNECTED : StompClientConnectionStatus.UNINITIALIZED
    };
  }

  componentDidMount() {
    this._websocketStatusStream = this.stompClientService.statusChanges()
      .subscribe({
        next: state => this.setState({ websocketStatus: state })
      });
  }

  componentWillUnmount() {
    this._websocketStatusStream?.unsubscribe();
  }

  render() {
    if (this.state.websocketStatus === StompClientConnectionStatus.CONNECTED || this.state.websocketStatus === StompClientConnectionStatus.UNINITIALIZED) {
      return null;
    }
    return (
      <PortalRenderer containerClassName='websocket-status-watcher-container'>
        <MessageBanner>
          {this._showComponentForCurrentStatus()}
        </MessageBanner>
      </PortalRenderer>
    );
  }

  private _showComponentForCurrentStatus() {
    if (this.state.websocketStatus === StompClientConnectionStatus.CONNECTING) {
      return (
        <span>
          <span>Trying to connect</span>
          <ThreeDots />
        </span>
      );
    } else if (this.state.websocketStatus !== StompClientConnectionStatus.CONNECTED) {
      return (
        <>
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
            onClick={this.stompClientService.reconnect}
            label='Click to reconnect' />
        </>
      );
    }
    return null;
  }

}
