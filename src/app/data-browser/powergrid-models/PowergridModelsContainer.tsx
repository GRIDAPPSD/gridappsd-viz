import * as React from 'react';
import { StompSubscription } from '@stomp/stompjs';

import { PowerGridModels } from './PowergridModels';
import { MRID } from '@shared/MRID';
import {
  QueryPowerGridModelsRequestBody, QueryPowerGridModelsRequestType, QueryPowerGridModelsRequest
} from './models/QueryPowerGridModelsRequest';
import { StompClientService } from '@shared/StompClientService';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';


interface Props {
  mRIDs: MRID[];
}

interface State {
  response: any;
  isFetching: boolean;
}


export class PowergridModelsContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _queryPowerGridModelsRequest = new QueryPowerGridModelsRequest();

  private _setupSubscription: Subscription;

  constructor(props: any) {
    super(props);
    this.state = {
      response: null,
      isFetching: false
    };
    this.fetchPowerGridModels = this.fetchPowerGridModels.bind(this);
  }

  componentDidMount() {
    this._setupSubscription = this._subscribeToPowerGridModelsTopic();
  }

  private _subscribeToPowerGridModelsTopic() {
    return this._stompClientService.readFrom(this._queryPowerGridModelsRequest.replyTo)
      .subscribe({
        next: data => {
          const payload = JSON.parse(data);
          this.setState(
            { response: JSON.stringify(payload.data, null, 4) || payload.error.message },
            () => this.setState({ isFetching: false })
          );
        }
      });
  }

  componentWillUnmount() {
    this._setupSubscription.unsubscribe();
  }

  render() {
    return (
      <PowerGridModels
        mRIDs={this.props.mRIDs}
        onSubmit={this.fetchPowerGridModels}
        response={this.state.response}
        isResponseReady={!this.state.isFetching} />
    );
  }

  fetchPowerGridModels(requestBody: QueryPowerGridModelsRequestBody) {
    this.setState({ isFetching: true, response: '' });
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
    this._stompClientService.send(
      this._queryPowerGridModelsRequest.url,
      { 'reply-to': this._queryPowerGridModelsRequest.replyTo },
      JSON.stringify(this._queryPowerGridModelsRequest.requestBody)
    );
  }
}