import * as React from 'react';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { StompClientService, StompClientConnectionStatus } from '@shared/StompClientService';
import { StompClient } from './StompClient';
import { download, DownloadType } from '@shared/misc';
import { NotificationBanner } from '@shared/notification-banner';

interface Props {
}

interface State {
  responseBody: string;
  isFetching: boolean;
  showExportCsvFailureNotification: boolean;
}


export class StompClientContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private _responseSubscription: Subscription = null;
  private _stompClientStatusSubscription: Subscription;

  constructor(props: any) {
    super(props);
    this.state = {
      isFetching: false,
      responseBody: '',
      showExportCsvFailureNotification: false
    };
    this.sendRequest = this.sendRequest.bind(this);
    this.downloadResponse = this.downloadResponse.bind(this);
  }

  componentDidMount() {
    this._stompClientStatusSubscription = this._watchStompClientStatusChanges();
  }

  private _watchStompClientStatusChanges() {
    return this._stompClientService.statusChanges()
      .subscribe({
        next: status => {
          switch (status) {
            case StompClientConnectionStatus.CONNECTING:
              if (this._responseSubscription)
                this._responseSubscription.unsubscribe();
              break;
            case StompClientConnectionStatus.CONNECTED:
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
      <>
        <StompClient
          onRequestSubmitted={this.sendRequest}
          response={this.state.responseBody}
          showLoadingIndicator={this.state.isFetching}
          onDownloadResponse={this.downloadResponse} />
        {
          this.state.showExportCsvFailureNotification
          &&
          <NotificationBanner>
            There was a problem exporting the response to CSV
          </NotificationBanner>
        }
      </>
    );
  }

  sendRequest(topic: string, requestBody: string) {
    this.setState({
      isFetching: true,
      responseBody: ''
    });
    if (requestBody !== '')
      requestBody = JSON.stringify(JSON.parse(requestBody));
    this._stompClientService.send(topic, { 'reply-to': '/stomp-client/response-queue' }, requestBody);
  }

  downloadResponse(downloadType: DownloadType) {
    if (downloadType === DownloadType.JSON)
      download('response.json', this.state.responseBody, downloadType);
    else {
      try {
        download('response.csv', this._convertResponseBodyToCsv(), downloadType);
      } catch {
        this.setState({
          showExportCsvFailureNotification: true
        });
        setTimeout(() => {
          this.setState({
            showExportCsvFailureNotification: false
          });
        }, 15_000);
      }
    }
  }

  private _convertResponseBodyToCsv() {
    const responseBody = JSON.parse(this.state.responseBody);
    const responseBodyKeys = Object.keys(responseBody);
    if (responseBodyKeys.length === 0)
      return '';
    const data = responseBody[responseBodyKeys[0]];
    if (!Array.isArray(data) || data.length === 0)
      return '';
    const columnNames = Object.keys(data[0]);
    const rows = [columnNames.join(',')];
    for (let i = 1; i < data.length; i++)
      rows.push(columnNames.map(columnName => data[i][columnName]).join(','));
    return rows.join('\n');
  }

}
