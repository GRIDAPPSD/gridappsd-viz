import * as React from 'react';
import { StompSubscription, Message } from '@stomp/stompjs';

import { StompClientService as Client } from '../services/StompClientService';
import { StompClient } from './StompClient';

interface Props {
}

interface State {
  responseBody: string;
  isFetching: boolean;
}


export class StompClientContainer extends React.Component<Props, State> {
  private readonly _stompClient = Client.getInstance();
  private _subscription: Promise<StompSubscription> = null;

  constructor(props: any) {
    super(props);
    this.state = {
      responseBody: '',
      isFetching: false
    };
    this._sendRequest = this._sendRequest.bind(this);
  }

  componentDidMount() {
    this._subscription = this._stompClient.subscribe('/stomp-client/response-queue', (message: Message) => {
      const responseBody = JSON.parse(message.body);
      this.setState({ responseBody: JSON.stringify(responseBody, null, 4) }, () => this.setState({ isFetching: false }));
    });
  }

  componentWillUnmount() {
    if (this._subscription)
      this._subscription.then(sub => sub.unsubscribe());
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