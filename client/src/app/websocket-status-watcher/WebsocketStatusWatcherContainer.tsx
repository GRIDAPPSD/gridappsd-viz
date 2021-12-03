import { Component } from 'react';
import { Subscription } from 'rxjs';

import { StompClientConnectionStatus, StompClientService } from '@client:common/StompClientService';

import { WebsocketStatusWatcher } from './WebsocketStatusWatcher';

interface Props {
}

interface State {
  websocketStatus: StompClientConnectionStatus;
}

export class WebsocketStatusWatcherContainer extends Component<Props, State> {

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
        next: status => {
          this.setState({
            websocketStatus: status
          });
        }
      });
  }

  componentWillUnmount() {
    this._websocketStatusStream?.unsubscribe();
  }

  render() {
    return (
      <WebsocketStatusWatcher
        websocketStatus={this.state.websocketStatus}
        onReconnect={this.stompClientService.reconnect} />
    );
  }

}
