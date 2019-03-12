import * as React from 'react';
import { StompSubscription, Message } from '@stomp/stompjs';

import { StompClientService } from '@shared/StompClientService';
import { StompClient } from './StompClient';
import { Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

interface Props {
}

interface State {
  responseBody: string;
  isFetching: boolean;
}


export class StompClientContainer extends React.Component<Props, State> {

  private readonly _stompClient = StompClientService.getInstance();
  private _setupSubscription: Subscription = null;
  private _topicResponseSubscription: StompSubscription = null;

  constructor(props: any) {
    super(props);
    this.state = {
      responseBody: '',
      isFetching: false
    };
    this.sendRequest = this.sendRequest.bind(this);
  }

  componentDidMount() {
    this._setupSubscription = this._subscribeForResponse();
  }

  private _subscribeForResponse() {
    return this._stompClient.readFrom('/stomp-client/response-queue')
      .pipe(
        map(body => JSON.parse(body)),
        map(payload => JSON.stringify(payload, null, 4))
      )
      .subscribe({
        next: result => this.setState({ responseBody: result }, () => this.setState({ isFetching: false }))
      });
  }

  componentWillUnmount() {
    this._setupSubscription.unsubscribe();
  }

  render() {
    return (
      <StompClient
        onRequestSubmitted={this.sendRequest}
        response={this.state.responseBody}
        isDone={!this.state.isFetching}
      />
    );
  }

  sendRequest(topic: string, requestBody: string) {
    this.setState({ isFetching: true, responseBody: '' });
    if (requestBody !== '') {
      requestBody = JSON.stringify(JSON.parse(requestBody));
    }
    this._stompClient.send(topic, { 'reply-to': '/stomp-client/response-queue' }, requestBody);
  }

}
