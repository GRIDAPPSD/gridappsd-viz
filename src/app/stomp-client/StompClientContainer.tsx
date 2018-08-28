import * as React from 'react';
import { StompSubscription, Message } from '@stomp/stompjs';

import { StompClient as Client } from '../services/StompClient';
import { StompClient } from './StompClient';

interface Props {
}

interface State {
  responseBody: string;
  isFetching: boolean;
}

let subscription: StompSubscription = null;


export class StompClientContainer extends React.Component<Props, State> {
  private readonly _stompClient = Client.getInstance();

  constructor(props: any) {
    super(props);
    this.state = {
      responseBody: '',
      isFetching: false
    };
    this._sendRequest = this._sendRequest.bind(this);
  }

  componentDidMount() {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
    const repeater = setInterval(() => {
      if (this._stompClient.isActive()) {
        clearInterval(repeater);
        subscription = this._stompClient.subscribe('/stomp-client/response-queue', (message: Message) => {
          const responseBody = JSON.parse(message.body);
          this.setState({ responseBody: JSON.stringify(responseBody, null, 4) }, () => this.setState({ isFetching: false }));
        });
      }
    }, 500);

  }

  componentWillUnmount() {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
  }
  render() {
    return (
      <StompClient
        onRequestSubmitted={this._sendRequest}
        response={this.state.responseBody}
        isDone={!this.state.isFetching}
      />
    );
  }

  private _sendRequest(topic: string, requestBody: string) {
    this.setState({ isFetching: true, responseBody: '' });
    this._stompClient.send(topic, { 'reply-to': '/stomp-client/response-queue' }, requestBody);
  }

}