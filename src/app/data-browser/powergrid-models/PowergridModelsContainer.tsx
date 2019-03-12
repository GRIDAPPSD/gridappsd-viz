import * as React from 'react';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { PowerGridModels } from './PowergridModels';
import { MRID } from '@shared/MRID';
import {
  QueryPowerGridModelsRequestBody, QueryPowerGridModelsRequestType, QueryPowerGridModelsRequest
} from './models/QueryPowerGridModelsRequest';
import { StompClientService } from '@shared/StompClientService';


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
      .pipe(
        map(body => JSON.parse(body)),
        map(payload => JSON.stringify(payload.data, null, 4) || payload.error.message)
      )
      .subscribe({
        next: response => this.setState({ response }, () => this.setState({ isFetching: false }))
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