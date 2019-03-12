import * as React from 'react';
import { Subscription, timer } from 'rxjs';
import { takeWhile, tap, switchMap } from 'rxjs/operators';

import { IconButton } from '@shared/buttons';
import { StompClientConnectionStatus, StompClientService } from '@shared/StompClientService';

import './WebsocketStatusWatcher.scss';

interface Props {
}

interface State {
  websocketStatus: StompClientConnectionStatus;
  dots: number;
}

export class WebsocketStatusWatcher extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private _websocketStatusStream: Subscription;

  constructor(props: any) {
    super(props);
    this.state = {
      websocketStatus: this._stompClientService.isActive() ? 'CONNECTED' : 'NEW',
      dots: 1
    };
  }

  componentDidMount() {
    this._websocketStatusStream = this._stompClientService.statusChanges()
      .pipe(
        tap(state => this.setState({ websocketStatus: state })),
        switchMap(state => timer(0, 1000).pipe(takeWhile(() => state === 'CONNECTING')))
      )
      .subscribe({
        next: count => this.setState({ dots: (count + 1) % 4 })
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
      <div className='websocket-status-watcher'>
        <div className='websocket-status-watcher__container'>
          {this._showComponentForCurrentStatus()}
        </div>
      </div>
    );
  }

  private _showComponentForCurrentStatus() {
    if (this.state.websocketStatus === 'CONNECTING')
      return (
        <span style={{ fontSize: '45px' }}>
          <span>Trying to connect</span>
          <span style={{ display: 'inline-block', width: '30px', textAlign: 'left' }}>
            {'.'.repeat(this.state.dots)}
          </span>
        </span>
      );
    else
      return (
        <>
          <span style={{ fontSize: '45px' }}>
            Unable to establish a connection
          </span>
          <br />
          <br />
          <span style={{ fontSize: '30px' }}>
            Check server or
          </span>
          <IconButton
            icon='websocket-connection-inactive'
            className='websocket-status-watcher__websocket-status-indicator'
            onClick={() => this._stompClientService.connect()}
            label='Click to reconnect' />
        </>
      );
  }

}
