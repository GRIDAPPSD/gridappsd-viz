import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { StompClientService } from '@shared/StompClientService';
import { QueryLogsRequestBody } from './models/QueryLogsRequestBody';
import { SimulationId } from './models/SimulationId';
import { QueryLogsForm } from './QueryLogsForm';
import { QueryLogsResultTable } from './QueryLogsResultTable';
import { Response } from '../Response';

interface Props {
}

interface State {
  result: any[];
  simulationIds: SimulationId[];
  sources: string[];
}

export class LogsContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private _unsubscribeNotifier = new Subject<void>();

  constructor(props: any) {
    super(props);
    this.state = {
      result: [],
      simulationIds: [],
      sources: ['ALL']
    };
    this.getSource = this.getSource.bind(this);
    this.getLogs = this.getLogs.bind(this);
  }

  componentDidMount() {
    this._fetchLatestTenSimulationIds();
    this._observeQueryLogsResult();
    this._observeSources();
  }

  private _fetchLatestTenSimulationIds() {
    this._stompClientService.readOnceFrom('query-logs.process-id')
      .pipe(map(body => JSON.parse(body).data as Array<SimulationId>))
      .subscribe({
        next: simulationIds => this.setState({ simulationIds })
      });
    this._stompClientService.send(
      'goss.gridappsd.process.request.data.log',
      { 'reply-to': 'query-logs.process-id' },
      '{"query": "select distinct(process_id), max(timestamp) as timestamp from log where process_id is not null group by process_id order by timestamp desc limit 10"}'
    );
  }

  private _observeQueryLogsResult() {
    this._stompClientService.readFrom('query-logs.result')
      .pipe(
        takeUntil(this._unsubscribeNotifier),
        map(body => JSON.parse(body).data || [])
      )
      .subscribe({
        next: queryResults => this.setState({ result: queryResults })
      });
  }

  private _observeSources() {
    this._stompClientService.readFrom('query-logs.source')
      .pipe(
        takeUntil(this._unsubscribeNotifier),
        map(body => JSON.parse(body).data as Array<{ source: string }>),
        map(sources => sources.map(source => source.source))
      )
      .subscribe({
        next: sources => this.setState({ sources: ['ALL', ...sources] })
      });
  }

  componentWillUnmount() {
    this._unsubscribeNotifier.next();
    this._unsubscribeNotifier.complete();
  }

  render() {
    return (
      <div style={{ boxShadow: '0 0 2px #888', height: '100%', position: 'relative' }}>
        <QueryLogsForm
          simulationIds={this.state.simulationIds}
          sources={this.state.sources}
          onSimulationIdSelected={this.getSource}
          onSubmit={this.getLogs} />
        <Response styles={{ boxShadow: 'initial', borderRadius: '0', height: '60vh', maxHeight: '60vh', overflow: 'initial' }}>
          {
            this.state.result.length > 0
              ?
              <QueryLogsResultTable rows={this.state.result} />
              :
              <div style={{ textAlign: 'center', transform: 'translateY(200px)', fontSize: '2em' }}>
                No result
              </div>
          }
        </Response>
      </div>
    );
  }

  getSource(simulationId: SimulationId) {
    this._stompClientService.send(
      'goss.gridappsd.process.request.data.log',
      { 'reply-to': 'query-logs.source' },
      `{"query": "select distinct(source) from log where process_id = ${simulationId.process_id}"}`
    );
  }

  getLogs(requestBody: QueryLogsRequestBody) {
    if (requestBody.source === 'ALL')
      delete requestBody.source;
    this._stompClientService.send(
      'goss.gridappsd.process.request.data.log',
      { 'reply-to': 'query-logs.result' },
      JSON.stringify(requestBody)
    );
  }

}
