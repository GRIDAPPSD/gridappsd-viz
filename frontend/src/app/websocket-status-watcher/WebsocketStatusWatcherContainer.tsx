import * as React from 'react';
import { Subscription } from 'rxjs';

import { StompClientConnectionStatus, StompClientService } from '@shared/StompClientService';
import { AuthenticatorService } from '@shared/authenticator';
import { WebsocketStatusWatcher } from './WebsocketStatusWatcher';

import './WebsocketStatusWatcher.light.scss';
import './WebsocketStatusWatcher.dark.scss';

interface Props {
}

interface State {
  websocketStatus: StompClientConnectionStatus;
}

export class WebsocketStatusWatcherContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _authenticatorService = AuthenticatorService.getInstance();

  private _websocketStatusStream: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      websocketStatus: this._stompClientService.isActive() ? StompClientConnectionStatus.CONNECTED : StompClientConnectionStatus.UNINITIALIZED
    };
  }

  componentDidMount() {
    this._websocketStatusStream = this._stompClientService.statusChanges()
      .subscribe({
        next: status => {
          this.setState({
            websocketStatus: status
          });
          if (status === StompClientConnectionStatus.DISCONNECTED) {
            setTimeout(this._authenticatorService.logout, 3000);
          }
        }
      });
  }

  componentWillUnmount() {
    this._websocketStatusStream?.unsubscribe();
  }

  render() {
    return (
      <WebsocketStatusWatcher websocketStatus={this.state.websocketStatus} />
    );
  }

}
