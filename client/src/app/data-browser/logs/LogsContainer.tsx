import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Component } from 'react';

import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { StompClientService, StompClientConnectionStatus } from '@client:common/StompClientService';
import { FilterableTable } from '@client:common/filterable-table';

import { Response } from '../DataBrowser';
import { RequestEditor } from '../DataBrowser';

import { QueryLogsRequestBody } from './models/QueryLogsRequestBody';
import { SimulationId } from './models/SimulationId';
import { QueryLogsForm } from './views/query-logs-form/QueryLogsForm';

import './Logs.light.scss';
import './Logs.dark.scss';

interface Props {
}

interface State {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any[];
  simulationIds: SimulationId[];
  sources: string[];
  showSpinner: boolean;
}

/**
 * The smart component that handles data fetching from the platform when selecting
 * "Browse Data" in the drawer menu, then "LOGS" tab
 */
export class LogsContainer extends Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();

  private _queryLogsResultSubscription: Subscription;
  private _sourcesSubscription: Subscription;
  private _stompClientStatusSubscription: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      result: [],
      simulationIds: [],
      sources: ['ALL'],
      showSpinner: false
    };
    this.getSource = this.getSource.bind(this);
    this.getLogs = this.getLogs.bind(this);
  }

  componentDidMount() {
    this._fetchLatestTenSimulationIds();
    this._stompClientStatusSubscription = this._watchStompClientStatusChanges();
  }

  private _fetchLatestTenSimulationIds() {
    this.setState({
      showSpinner: true
    });
    this._stompClientService.readOnceFrom<SimulationId[]>('query-logs.process-id')
      .subscribe({
        next: payload => {
          this.setState({
            simulationIds: payload,
            showSpinner: false
          });
        }
      });
    this._stompClientService.send({
      destination: 'goss.gridappsd.process.request.data.log',
      replyTo: 'query-logs.process-id',
      body: '{"query": "select distinct(process_id), max(timestamp) as timestamp from log where process_id is not null and process_type=\'/queue/goss.gridappsd.process.request.simulation\' group by process_id order by timestamp desc limit 10"}'
    });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this._stompClientService.readFrom<any[]>('query-logs.result')
      .subscribe({
        next: payload => {
          this.setState({
            result: payload || [],
            showSpinner: false
          });
        }
      });
  }

  private _observeSources() {
    return this._stompClientService.readFrom<Array<{ source: string }>>('query-logs.source')
      .pipe(map(payload => payload.map(source => source.source)))
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
        <RequestEditor>
          <QueryLogsForm
            simulationIds={this.state.simulationIds}
            sources={this.state.sources}
            onSimulationIdSelected={this.getSource}
            onSubmit={this.getLogs} />
        </RequestEditor>
        <Response>
          <FilterableTable rows={this.state.result} />
        </Response>
        <ProgressIndicator show={this.state.showSpinner} />
      </div>
    );
  }

  getSource(simulationId: SimulationId) {
    this._stompClientService.send({
      destination: 'goss.gridappsd.process.request.data.log',
      replyTo: 'query-logs.source',
      body: `{"query": "select distinct(source) from log where process_id = ${simulationId.process_id}"}`
    });
  }

  getLogs(requestBody: QueryLogsRequestBody) {
    this.setState({
      showSpinner: true
    });
    if (requestBody.source === 'ALL') {
      delete requestBody.source;
    }
    this._stompClientService.send({
      destination: 'goss.gridappsd.process.request.data.log',
      replyTo: 'query-logs.result',
      body: JSON.stringify(requestBody)
    });
  }

}
