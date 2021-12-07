import { Component } from 'react';
import { Subscription } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { download, DownloadType } from '@client:common/misc';
import { Notification } from '@client:common/overlay/notification';
import { StompClientService } from '@client:common/StompClientService';

import { StompClient } from './StompClient';

interface Props {
}

interface State {
  responseBody: string;
  isFetching: boolean;
}


export class StompClientContainer extends Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();

  private _responseSubscription: Subscription = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      isFetching: false,
      responseBody: ''
    };
    this.sendRequest = this.sendRequest.bind(this);
    this.downloadResponse = this.downloadResponse.bind(this);
  }

  componentWillUnmount() {
    this._responseSubscription?.unsubscribe();
  }

  render() {
    return (
      <StompClient
        onRequestSubmitted={this.sendRequest}
        response={this.state.responseBody}
        showLoadingIndicator={this.state.isFetching}
        onDownloadResponse={this.downloadResponse} />
    );
  }

  sendRequest(destinationTopic: string, responseTopic: string, requestBody: string) {
    this._subscribeForResponse(responseTopic);
    this.setState({
      isFetching: true,
      responseBody: ''
    });
    this._stompClientService.send({
      destination: destinationTopic,
      replyTo: responseTopic,
      body: requestBody
    });
  }

  private _subscribeForResponse(topic: string) {
    this._responseSubscription?.unsubscribe();
    this._responseSubscription = this._stompClientService.readOnceFrom(topic)
      .pipe(
        map(payload => JSON.stringify(payload, null, 4)),
        finalize(() => {
          this.setState({
            isFetching: false
          });
        })
      )
      .subscribe({
        next: result => {
          this.setState({
            responseBody: result
          });
        },
        error: errorMessage => {
          this.setState({
            responseBody: errorMessage
          });
        }
      });
  }

  downloadResponse(downloadType: DownloadType) {
    if (downloadType === DownloadType.JSON) {
      download('response', this.state.responseBody, downloadType);
    } else {
      try {
        download('response', this._convertResponseBodyToCsv(), downloadType);
      } catch {
        Notification.open('There was a problem exporting the response to CSV');
      }
    }
  }

  private _convertResponseBodyToCsv() {
    const responseBody = JSON.parse(this.state.responseBody);
    if (!Array.isArray(responseBody) || responseBody.length === 0) {
      return '';
    }
    const columnNames = Object.keys(responseBody[0]);
    const rows = [columnNames.join(',')];
    for (const row of responseBody) {
      rows.push(columnNames.map(columnName => row[columnName]).join(','));
    }
    return rows.join('\n');
  }

}
