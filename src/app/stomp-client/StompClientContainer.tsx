import * as React from 'react';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';


import { StompClientService } from '@shared/StompClientService';
import { StompClient } from './StompClient';

interface Props {
}

interface State {
  responseBody: string;
  isFetching: boolean;
}


export class StompClientContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private _responseSubscription: Subscription = null;
  private _stompClientStatusSubscription: Subscription;

  constructor(props: any) {
    super(props);
    this.state = {
      responseBody: '',
      isFetching: false
    };
    this.sendRequest = this.sendRequest.bind(this);
  }

  componentDidMount() {
    this._stompClientStatusSubscription = this._watchStompClientStatusChanges();
  }

  private _watchStompClientStatusChanges() {
    return this._stompClientService.statusChanges()
      .subscribe({
        next: status => {
          switch (status) {
            case 'CONNECTING':
              if (this._responseSubscription)
                this._responseSubscription.unsubscribe();
              break;
            case 'CONNECTED':
              this._responseSubscription = this._subscribeForResponse();
              break;
          }
        }
      });
  }

  private _subscribeForResponse() {
    return this._stompClientService.readFrom('/stomp-client/response-queue')
      .pipe(
        map(body => JSON.parse(body)),
        map(payload => JSON.stringify(payload, null, 4))
      )
      .subscribe({
        next: result => this.setState({ responseBody: result }, () => this.setState({ isFetching: false }))
      });
  }

  componentWillUnmount() {
    this._responseSubscription.unsubscribe();
    this._stompClientStatusSubscription.unsubscribe();
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
    this._stompClientService.send(topic, { 'reply-to': '/stomp-client/response-queue' }, requestBody);
  }

}
