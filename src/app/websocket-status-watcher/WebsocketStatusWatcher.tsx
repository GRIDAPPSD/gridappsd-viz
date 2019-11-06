import * as React from 'react';
import { Subscription } from 'rxjs';

import { IconButton } from '@shared/buttons';
import { StompClientConnectionStatus, StompClientService } from '@shared/StompClientService';
import { NotificationBanner } from '@shared/notification-banner';
import { ThreeDots } from '@shared/three-dots';

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
      websocketStatus: this.stompClientService.isActive() ? 'CONNECTED' : 'NEW'
    };
  }

  componentDidMount() {
    this._websocketStatusStream = this.stompClientService.statusChanges()
      .subscribe({
        next: state => this.setState({ websocketStatus: state })
      });
  }

  componentWillUnmount() {
    if (this._websocketStatusStream)
      this._websocketStatusStream.unsubscribe();
  }

  render() {
    if (this.state.websocketStatus === 'CONNECTED' || this.state.websocketStatus === 'NEW')
      return null;
    return (
      <NotificationBanner persistent={true}>
        {this._showComponentForCurrentStatus()}
      </NotificationBanner>
    );
  }

  private _showComponentForCurrentStatus() {
    if (this.state.websocketStatus === 'CONNECTING')
      return (
        <span>
          <span>Trying to connect</span>
          <ThreeDots />
        </span>
      );
    else if (this.state.websocketStatus !== 'CONNECTED')
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
    return null;
  }

}
