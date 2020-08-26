import * as React from 'react';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { StompClientService } from '@shared/StompClientService';
import { StompClient } from './StompClient';
import { download, DownloadType } from '@shared/misc';
import { showNotification } from '@shared/overlay/notification';

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
    this._responseSubscription.unsubscribe();
    this._stompClientStatusSubscription.unsubscribe();
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
      .pipe(map(payload => JSON.stringify(payload, null, 4)))
      .subscribe({
        next: result => this.setState({ responseBody: result }, () => this.setState({ isFetching: false }))
      });
  }

  downloadResponse(downloadType: DownloadType) {
    if (downloadType === DownloadType.JSON) {
      download('response', this.state.responseBody, downloadType);
    } else {
      try {
        download('response', this._convertResponseBodyToCsv(), downloadType);
      } catch {
        showNotification('There was a problem exporting the response to CSV');
      }
    }
  }

  private _convertResponseBodyToCsv() {
    const responseBody = JSON.parse(this.state.responseBody);
    const responseBodyKeys = Object.keys(responseBody);
    if (responseBodyKeys.length === 0) {
      return '';
    }
    const data = responseBody[responseBodyKeys[0]];
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }
    const columnNames = Object.keys(data[0]);
    const rows = [columnNames.join(',')];
    for (let i = 1; i < data.length; i++) {
      rows.push(columnNames.map(columnName => data[i][columnName]).join(','));
    }
    return rows.join('\n');
  }

}
