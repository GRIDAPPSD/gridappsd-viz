import * as React from 'react';
import { Subscription } from 'rxjs';

import { StompClientService, StompClientConnectionStatus } from '../../../services/StompClientService';
import { IconButton } from '../../../shared/views/buttons/icon-button/IconButton';

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
  private _dotsCalculator;

  constructor(props: any) {
    super(props);
    this.state = {
      websocketStatus: this._stompClientService.isActive() ? 'CONNECTED' : 'INIT',
      dots: 1
    };
  }

  componentDidMount() {
    this._websocketStatusStream = this._stompClientService.statusChanges()
      .subscribe(state => this.setState({ websocketStatus: state }));
    this._dotsCalculator = setInterval(() => {
      this.setState(prevState => {
        return { dots: (prevState.dots + 1) % 4 };
      });
    }, 1000);
  }

  componentWillUnmount() {
    if (this._websocketStatusStream)
      this._websocketStatusStream.unsubscribe();
    clearInterval(this._dotsCalculator);
  }

  render() {
    if (this.state.websocketStatus === 'CONNECTED')
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
          <span>Connection lost, trying to reconnect</span>
          <span style={{ display: 'inline-block', width: '30px', textAlign: 'left' }}>{'.'.repeat(this.state.dots)}</span>
        </span>
      );
    if (this.state.websocketStatus === 'INIT')
      return (
        <span style={{ fontSize: '45px' }}>
          <span>Trying to connect</span>
          <span style={{ display: 'inline-block', width: '30px', textAlign: 'left' }}>{'.'.repeat(this.state.dots)}</span>
        </span>
      );
    else
      return (
        <>
          <span style={{ fontSize: '45px' }}>Connection failed to establish</span>
          <br />
          <br />
          <span style={{ fontSize: '30px' }}>Check server or</span>
          <IconButton
            icon='websocket-connection-inactive'
            className='websocket-status-watcher__websocket-status-indicator'
            onClick={() => this._stompClientService.reconnect()}
            label='Click to reconnect' />
        </>
      );
  }
}