import * as React from 'react';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { StompClientService, StompClientConnectionStatus } from '@shared/StompClientService';
import { QueryLogsRequestBody } from './models/QueryLogsRequestBody';
import { SimulationId } from './models/SimulationId';
import { QueryLogsForm } from './QueryLogsForm';
import { QueryLogsResultTable } from './QueryLogsResultTable';
import { Response } from '../Response';
import { NotificationBanner } from '@shared/notification-banner';

import './Logs.light.scss';
import './Logs.dark.scss';

interface Props {
}

interface State {
  result: any[];
  simulationIds: SimulationId[];
  sources: string[];
}

export class LogsContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private _queryLogsResultSubscription: Subscription;
  private _sourcesSubscription: Subscription;
  private _stompClientStatusSubscription: Subscription;

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
    this._stompClientStatusSubscription = this._watchStompClientStatusChanges();
  }

  private _fetchLatestTenSimulationIds() {
    this._stompClientService.readOnceFrom('query-logs.process-id')
      .pipe(map(JSON.parse as (body: string) => { data: SimulationId[] }))
      .subscribe({
        next: payload => this.setState({ simulationIds: payload.data })
      });
    this._stompClientService.send(
      'goss.gridappsd.process.request.data.log',
      { 'reply-to': 'query-logs.process-id' },
      `{"query": "select distinct(process_id), max(timestamp) as timestamp from log where process_id is not null and process_type='/queue/goss.gridappsd.process.request.simulation' group by process_id order by timestamp desc limit 10"}`
    );
  }

  private _watchStompClientStatusChanges() {
    return this._stompClientService.statusChanges()
      .subscribe({
        next: status => {
          switch (status) {
            case StompClientConnectionStatus.CONNECTING:
              this._queryLogsResultSubscription?.unsubscribe();
              this._sourcesSubscription?.unsubscribe();
              break;
            case StompClientConnectionStatus.CONNECTED:
              this._queryLogsResultSubscription = this._observeQueryLogsResult();
              this._sourcesSubscription = this._observeSources();
              break;
          }
        }
      });
  }

  private _observeQueryLogsResult() {
    return this._stompClientService.readFrom('query-logs.result')
      .pipe(map(JSON.parse as (body: string) => any))
      .subscribe({
        next: queryResults => this.setState({ result: queryResults.data || [] })
      });
  }

  private _observeSources() {
    return this._stompClientService.readFrom('query-logs.source')
      .pipe(
        map(JSON.parse as (body: string) => { data: Array<{ source: string }> }),
        map(payload => payload.data.map(source => source.source))
      )
      .subscribe({
        next: sources => this.setState({ sources: ['ALL', ...sources] })
      });
  }

  componentWillUnmount() {
    this._queryLogsResultSubscription.unsubscribe();
    this._sourcesSubscription.unsubscribe();
    this._stompClientStatusSubscription.unsubscribe();
  }

  render() {
    return (
      <div className='log-data-browser'>
        <QueryLogsForm
          simulationIds={this.state.simulationIds}
          sources={this.state.sources}
          onSimulationIdSelected={this.getSource}
          onSubmit={this.getLogs} />
        <Response>
          {
            this.state.result.length > 0
              ?
              <QueryLogsResultTable rows={this.state.result} />
              :
              <NotificationBanner persistent>
                No result
              </NotificationBanner>
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
