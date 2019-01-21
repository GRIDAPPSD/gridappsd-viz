import * as React from 'react';
import { StompSubscription } from '@stomp/stompjs';

import { QueryLogs } from './views/QueryLogs';
import { StompClientService } from '../services/StompClientService';
import { SimulationId } from './models/SimulationId';
import { QueryLogsRequestBody } from './models/QueryLogsRequestBody';


interface Props {
  onClose: () => void;
}

interface State {
  result: any[];
  simulationIds: SimulationId[];
  sources: string[];
}

export class QueryLogsContainer extends React.Component<Props, State> {
  private readonly _stompClient = StompClientService.getInstance();
  private _queryResult: Promise<StompSubscription>;

  constructor(props: any) {
    super(props);
    this.state = {
      result: [],
      simulationIds: [],
      sources: ['ALL']
    };
    this._onClose = this._onClose.bind(this);
    this._getSource = this._getSource.bind(this);
    this._getLogs = this._getLogs.bind(this);
  }

  componentDidMount() {
    this._getAllSimulationIds();
    this._queryResult = this._stompClient.subscribe('query-logs.result', message => {
      this.setState({ result: JSON.parse(message.body).data })
    });
  }

  render() {
    return (
      <QueryLogs
        result={this.state.result}
        simulationIds={this.state.simulationIds}
        sources={this.state.sources}
        onSimulationIdSelected={this._getSource}
        onClose={this._onClose}
        onSubmit={this._getLogs} />
    );
  }

  private _onClose() {
    this.props.onClose();
    if (this._queryResult)
      this._queryResult.then(sub => sub.unsubscribe());
  }

  private _getLogs(requestBody: QueryLogsRequestBody) {
    this._stompClient.send(
      'goss.gridappsd.process.request.data.log',
      { 'reply-to': 'query-logs.result' },
      JSON.stringify(requestBody)
    );
  }

  private _getAllSimulationIds() {
    this._stompClient.subscribe('query-logs.process-id', message => {
      const simulationIds: Array<SimulationId> = JSON.parse(message.body).data;
      this.setState({ simulationIds });
    })
      .then(sub => sub.unsubscribe());
    this._stompClient.send(
      'goss.gridappsd.process.request.data.log',
      { 'reply-to': 'query-logs.process-id' },
      '{"query": "select distinct(process_id), min(timestamp) as timestamp from log where process_id is not null group by process_id order by timestamp desc limit 10"}'
    );
  }

  private _getSource(simulationId: SimulationId) {
    this._stompClient.subscribe('query-logs.source', message => {
      const sources: string[] = JSON.parse(message.body).data.map((e: { source: string }) => e.source);
      this.setState({ sources: ['ALL', ...sources] });
    })
      .then(sub => sub.unsubscribe());
    this._stompClient.send(
      'goss.gridappsd.process.request.data.log',
      { 'reply-to': 'query-logs.source' },
      `{"query": "select distinct(source) from log where process_id = ${simulationId.process_id}"}`
    );
  }
}