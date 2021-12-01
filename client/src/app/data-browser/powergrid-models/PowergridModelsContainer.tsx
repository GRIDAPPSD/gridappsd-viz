import { Component } from 'react';
import { Subscription, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { StompClientService, StompClientConnectionStatus } from '@client:common/StompClientService';
import { FeederModelLine } from '@client:common/topology';

import { PowerGridModels } from './PowergridModels';
import {
  QueryPowerGridModelsRequestBody, QueryPowerGridModelsRequestType, QueryPowerGridModelsRequest
} from './models/QueryPowerGridModelsRequest';

interface Props {
  feederModelLines: FeederModelLine[];
}

interface State {
  response: string;
  isFetching: boolean;
}


export class PowergridModelsContainer extends Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _queryPowerGridModelsRequest = new QueryPowerGridModelsRequest();

  private _setupSubscription: Subscription;
  private _stompClientStatusSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      response: '',
      isFetching: false
    };
    this.fetchPowerGridModels = this.fetchPowerGridModels.bind(this);
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
              this._setupSubscription?.unsubscribe();
              break;
            case StompClientConnectionStatus.CONNECTED:
              this._setupSubscription = this._subscribeToPowerGridModelsTopic();
              break;
          }
        }
      });
  }

  private _subscribeToPowerGridModelsTopic() {
    return this._stompClientService.readFrom(this._queryPowerGridModelsRequest.replyTo)
      .pipe(
        map(payload => JSON.stringify(payload, null, 4)),
        catchError(() => of(''))
      )
      .subscribe({
        next: response => {
          this.setState(
            { response },
            () => this.setState({ isFetching: false })
          );
        }
      });
  }

  componentWillUnmount() {
    this._setupSubscription.unsubscribe();
    this._stompClientStatusSubscription.unsubscribe();
  }

  render() {
    return (
      <PowerGridModels
        feederModelLines={this.props.feederModelLines}
        onSubmit={this.fetchPowerGridModels}
        response={this.state.response}
        isResponseReady={!this.state.isFetching} />
    );
  }

  fetchPowerGridModels(requestBody: QueryPowerGridModelsRequestBody) {
    this.setState({
      isFetching: true,
      response: ''
    });
    this._queryPowerGridModelsRequest.requestBody = {
      requestType: requestBody.requestType,
      resultFormat: requestBody.resultFormat
    } as QueryPowerGridModelsRequestBody;

    switch (requestBody.requestType) {
      case QueryPowerGridModelsRequestType.QUERY:
        this._queryPowerGridModelsRequest.requestBody.queryString = requestBody.queryString;
        break;
      case QueryPowerGridModelsRequestType.QUERY_MODEL:
        this._queryPowerGridModelsRequest.requestBody.modelId = requestBody.modelId;
        this._queryPowerGridModelsRequest.requestBody.filter = requestBody.filter;
        break;
      case QueryPowerGridModelsRequestType.QUERY_MODEL_NAMES:
        break;
      case QueryPowerGridModelsRequestType.QUERY_OBJECT:
        this._queryPowerGridModelsRequest.requestBody.objectId = requestBody.objectId;
        break;
      case QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES:
        this._queryPowerGridModelsRequest.requestBody.modelId = requestBody.modelId;
        break;
    }
    this._stompClientService.send({
      destination: this._queryPowerGridModelsRequest.url,
      replyTo: this._queryPowerGridModelsRequest.replyTo,
      body: JSON.stringify(this._queryPowerGridModelsRequest.requestBody)
    });
  }

}
