import * as React from 'react';
import { StompSubscription } from '@stomp/stompjs';

import { PowerGridModels } from './PowergridModels';
import { MRID } from '../../models/MRID';
import { QueryPowerGridModelsRequestBody, QueryPowerGridModelsRequestType } from '../../models/message-requests/QueryPowerGridModelsRequest';
import { MessageService } from '../../services/MessageService';


interface Props {
  mRIDs: MRID[];
}

interface State {
  response: any;
  isFetching: boolean;
}


export class PowergridModelsContainer extends React.Component<Props, State> {
  private readonly _messageService = MessageService.getInstance();
  private _blazeGraphSubscription: Promise<StompSubscription>;

  constructor(props: any) {
    super(props);
    this.state = {
      response: null,
      isFetching: false
    };
    this._queryBlazeGraph = this._queryBlazeGraph.bind(this);
  }

  componentWillUnmount() {
    if (this._blazeGraphSubscription)
      this._blazeGraphSubscription.then(sub => sub.unsubscribe());
  }

  render() {
    return (
      <PowerGridModels
        mRIDs={this.props.mRIDs}
        onSubmit={this._queryBlazeGraph}
        response={this.state.response}
        isResponseReady={!this.state.isFetching} />
    );
  }

  private _subscribe() {
    this._blazeGraphSubscription = this._messageService.onBlazeGraphDataReceived(payload => {
      this.setState(
        { response: payload.data },
        () => this.setState({ isFetching: false })
      );
    });
  }

  private _queryBlazeGraph(requestBody: QueryPowerGridModelsRequestBody) {
    if (!this._blazeGraphSubscription)
      this._subscribe();
    this.setState({ isFetching: true });
    const cleanedUpRequestBody = {
      requestType: requestBody.requestType,
      resultFormat: requestBody.resultFormat
    } as QueryPowerGridModelsRequestBody;

    switch (requestBody.requestType) {
      case QueryPowerGridModelsRequestType.QUERY:
        cleanedUpRequestBody.queryString = requestBody.queryString;
        break;
      case QueryPowerGridModelsRequestType.QUERY_MODEL:
        cleanedUpRequestBody.modelId = requestBody.modelId;
        cleanedUpRequestBody.filter = requestBody.filter;
        break;
      case QueryPowerGridModelsRequestType.QUERY_MODEL_NAMES:
        break;
      case QueryPowerGridModelsRequestType.QUERY_OBJECT:
        cleanedUpRequestBody.objectId = requestBody.objectId;
        break;
      case QueryPowerGridModelsRequestType.QUERY_OBJECT_TYPES:
        cleanedUpRequestBody.modelId = requestBody.modelId;
        break;
    }
    this._messageService.fetchDataForPowergridModels(cleanedUpRequestBody);
  }
}