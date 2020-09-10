import * as React from 'react';
import { Subscription } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { ExpectedResultComparisonType } from '@shared/ExpectedResultComparisonType';
import { StompClientService } from '@shared/StompClientService';
import { TimeSeriesVsTimeSeries } from './views/time-series-vs-time-series/TimeSeriesVsTimeSeries';
import { ResultViewer } from './views/result-viewer/ResultViewer';
import { TimeSeriesVsTimeSeriesRequest } from './models/TimeSeriesVsTimeSeriesRequest';
import { StateStore } from '@shared/state-store';
import { SimulationVsExpected } from './views/simulation-vs-expected/SimulationVsExpected';
import { SimulationVsExpectedRequest } from './models/SimulationVsExpectedRequest';
import { MessageRequest } from '@shared/MessageRequest';
import { Notification } from '@shared/overlay/notification';
import { SimulationVsTimeSeries } from './views/simulation-vs-time-series/SimulationVsTimeSeries';
import { SimulationVsTimeSeriesRequest } from './models/SimulationVsTimeSeriesRequest';
import { ExpectedVsTimeSeries } from './views/expected-vs-time-series/ExpectedVsTimeSeries';
import { ExpectedVsTimeSeriesRequest } from './models/ExpectedVsTimeSeriesRequest';

import './ExpectedResultComparison.light.scss';
import './ExpectedResultComparison.dark.scss';

interface Props {
}

interface State {
  comparisonType: ExpectedResultComparisonType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comparisonResults: any[];
  simulationIds: string[];
  isFetching: boolean;
}

export class ExpectedResultComparisonContainer extends React.Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _responseSubscription: Subscription;
  private _stateStoreSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      comparisonType: null,
      comparisonResults: [],
      simulationIds: [],
      isFetching: false
    };

    this.onSimulationVsExpectedFormSubmited = this.onSimulationVsExpectedFormSubmited.bind(this);
    this.onSimulationVsTimeSeriesFormSubmit = this.onSimulationVsTimeSeriesFormSubmit.bind(this);
    this.onExpectedVsTimeSeriesFormSubmit = this.onExpectedVsTimeSeriesFormSubmit.bind(this);
    this.onTimeSeriesVsTimeSeriesFormSubmit = this.onTimeSeriesVsTimeSeriesFormSubmit.bind(this);
  }

  componentDidMount() {
    this._stateStoreSubscription = this._stateStore.select('expectedResultComparisonType')
      .subscribe({
        next: selectedType => {
          this.setState({
            comparisonType: selectedType
          });
          switch (selectedType) {
            case ExpectedResultComparisonType.SIMULATION_VS_TIME_SERIES:
            case ExpectedResultComparisonType.EXPECTED_VS_TIME_SERIES:
            case ExpectedResultComparisonType.TIME_SERIES_VS_TIME_SERIES:
              this._fetchAllSimulationIds();
              break;
          }
        }
      });
  }

  private _fetchAllSimulationIds() {
    const destinationTopic = 'goss.gridappsd.process.request.data.log';
    const responseTopic = '/simulation-ids';
    const requestBody = '{"query": "select distinct(process_id), max(timestamp) as timestamp from log where process_id is not null and process_type=\'/queue/goss.gridappsd.process.request.simulation\' group by process_id order by timestamp desc"}';

    // eslint-disable-next-line camelcase
    this._stompClientService.readOnceFrom<Array<{ process_id: string; timestamp: string }>>(responseTopic)
      .pipe(map(payload => payload.map(e => e.process_id)))
      .subscribe({
        next: simulationIds => {
          this.setState({
            simulationIds
          });
        }
      });
    this._stompClientService.send({
      destination: destinationTopic,
      body: requestBody,
      replyTo: responseTopic
    });
  }

  componentWillUnmount() {
    this._stateStoreSubscription.unsubscribe();
    this._responseSubscription?.unsubscribe();
  }

  render() {
    return (
      <div className='expected-result-comparison'>
        {this.selectComponentBasedComparisonType()}
        <ResultViewer
          results={this.state.comparisonResults}
          showProgressIndicator={this.state.isFetching} />
      </div>
    );
  }

  selectComponentBasedComparisonType() {
    switch (this.state.comparisonType) {
      case ExpectedResultComparisonType.SIMULATION_VS_EXPECTED:
        return (
          <SimulationVsExpected onSubmit={this.onSimulationVsExpectedFormSubmited} />
        );

      case ExpectedResultComparisonType.SIMULATION_VS_TIME_SERIES:
        return (
          <SimulationVsTimeSeries
            simulationIds={this.state.simulationIds}
            onSubmit={this.onSimulationVsTimeSeriesFormSubmit} />
        );

      case ExpectedResultComparisonType.EXPECTED_VS_TIME_SERIES:
        return (
          <ExpectedVsTimeSeries
            simulationIds={this.state.simulationIds}
            onSubmit={this.onExpectedVsTimeSeriesFormSubmit} />
        );

      case ExpectedResultComparisonType.TIME_SERIES_VS_TIME_SERIES:
        return (
          <TimeSeriesVsTimeSeries
            simulationIds={this.state.simulationIds}
            onSubmit={this.onTimeSeriesVsTimeSeriesFormSubmit} />
        );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSimulationVsExpectedFormSubmited(expectedResults: any, events: any[]) {
    this._fetchResponse(new SimulationVsExpectedRequest(expectedResults, events));
  }

  private _fetchResponse(request: MessageRequest) {
    this.setState({
      isFetching: true
    });
    this._responseSubscription?.unsubscribe();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._responseSubscription = this._stompClientService.readOnceFrom<any[] | any>(request.replyTo)
      .pipe(finalize(() => {
        this.setState({
          isFetching: false
        });
      }))
      .subscribe({
        next: data => {
          this.setState({
            comparisonResults: Array.isArray(data) ? data : data.events
          });
        },
        error: errorMessage => {
          Notification.open(errorMessage);
        }
      });
    this._stompClientService.send({
      destination: request.url,
      body: JSON.stringify(request.requestBody),
      replyTo: request.replyTo
    });
  }

  onSimulationVsTimeSeriesFormSubmit(simulationId: number) {
    this._fetchResponse(new SimulationVsTimeSeriesRequest(simulationId));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onExpectedVsTimeSeriesFormSubmit(expectedResults: any, simulationId: number) {
    this._fetchResponse(new ExpectedVsTimeSeriesRequest(expectedResults, simulationId));
  }

  onTimeSeriesVsTimeSeriesFormSubmit(firstSimulationId: number, secondSimulationId: number) {
    this._fetchResponse(new TimeSeriesVsTimeSeriesRequest(firstSimulationId, secondSimulationId));
  }

}
