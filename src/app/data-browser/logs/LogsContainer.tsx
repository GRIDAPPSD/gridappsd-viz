import * as React from 'react';
import { StompSubscription } from '@stomp/stompjs';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { Logs } from './Logs';
import { StompClientService } from '../../services/StompClientService';
import { QueryLogsRequestBody } from './models/QueryLogsRequestBody';
import { SimulationId } from './models/SimulationId';


interface Props {
}

interface State {
  result: any[];
  simulationIds: SimulationId[];
  sources: string[];
}

export class LogsContainer extends React.Component<Props, State> {
  private readonly _stompClient = StompClientService.getInstance();
  private _queryResult: Promise<StompSubscription>;
  private _websocketStatus: Subscription;
  constructor(props: any) {
    super(props);
    this.state = {
      result: [],
      simulationIds: [],
      sources: ['ALL']
    };
    this._getSource = this._getSource.bind(this);
    this._getLogs = this._getLogs.bind(this);
  }

  componentDidMount() {
    this._websocketStatus = this._stompClient.statusChanges()
      .pipe(filter(status => status === 'CONNECTED'), map(() => this._observeQueryLogsResult()))
      .subscribe(sub => this._queryResult = sub);

    this._getAllSimulationIds();
  }

  componentWillUnmount() {
    if (this._queryResult)
      this._queryResult.then(sub => sub.unsubscribe());
    this._websocketStatus.unsubscribe();
  }

  private _observeQueryLogsResult() {
    return this._stompClient.subscribe('query-logs.result', message => this.setState({ result: JSON.parse(message.body).data }));
  }

  render() {
    return (
      <Logs
        result={this.state.result}
        simulationIds={this.state.simulationIds}
        sources={this.state.sources}
        onSimulationIdSelected={this._getSource}
        onSubmit={this._getLogs} />
    );
  }

  private _getLogs(requestBody: QueryLogsRequestBody) {
    if (requestBody.source === 'ALL')
      delete requestBody.source;
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
      '{"query": "select distinct(process_id), max(timestamp) as timestamp from log where process_id is not null group by process_id order by timestamp desc limit 10"}'
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