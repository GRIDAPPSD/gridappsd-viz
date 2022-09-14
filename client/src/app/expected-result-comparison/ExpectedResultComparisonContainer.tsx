import { Component } from 'react';
import { Subscription } from 'rxjs';
import { map, finalize, takeWhile } from 'rxjs/operators';

import { ExpectedResultComparisonType } from '@client:common/ExpectedResultComparisonType';
import { StateStore } from '@client:common/state-store';
import { Notification } from '@client:common/overlay/notification';
import { StompClientService } from '@client:common/StompClientService';
import { MessageRequest } from '@client:common/MessageRequest';

import { TimeSeriesVsTimeSeries } from './views/time-series-vs-time-series/TimeSeriesVsTimeSeries';
import { ResultViewer } from './views/result-viewer/ResultViewer';
import { TimeSeriesVsTimeSeriesRequest } from './models/TimeSeriesVsTimeSeriesRequest';
import { SimulationVsExpected } from './views/simulation-vs-expected/SimulationVsExpected';
import { SimulationVsExpectedRequest } from './models/SimulationVsExpectedRequest';
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
  comparisonResult: any[] | any;
  simulationIds: string[];
  isFetching: boolean;
}

export class ExpectedResultComparisonContainer extends Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _responseSubscription: Subscription;
  private _stateStoreSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      comparisonType: null,
      comparisonResult: [],
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
          result={this.state.comparisonResult}
          showProgressIndicator={this.state.isFetching}
          comparisonType={this.state.comparisonType} />
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
  onSimulationVsExpectedFormSubmited(simulationConfiguration: any, expectedResults: any, events: any[]) {
    this._fetchResponse(new SimulationVsExpectedRequest(simulationConfiguration, expectedResults, events));
  }

  private _fetchResponse(request: MessageRequest) {
    const payload = [] as unknown[];

    this.setState({
      isFetching: true
    });
    this._responseSubscription?.unsubscribe();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._responseSubscription = this._stompClientService.readFrom<any[] | any>(request.replyTo)
      .pipe(
        takeWhile(data => data.status !== 'finish'),
        finalize(() => {
          this.setState({
            isFetching: false
          });
        }))
      .subscribe({
        next: data => {
          if (data.status !== 'start') {
            payload.push(data);
          }
        },
        error: errorMessage => {
          Notification.open(errorMessage);
        },
        complete: () => {
          this.setState({
            comparisonResult: payload
          });
        }
      });
    this._stompClientService.send({
      destination: request.url,
      body: JSON.stringify(request.requestBody),
      replyTo: request.replyTo
    });
  }

  private _dynamicallyFetchResponse(request: MessageRequest) {
    this._responseSubscription = this._stompClientService.readFrom<any[] | any>(request.replyTo)
    .pipe(
      takeWhile(data => data.status !== 'finish')
    )
    .subscribe({
      next: data => {
        if (data.status !== 'start') {
          this.setState({
            comparisonResult: [...this.state.comparisonResult, data]
          });
        }
      },
      complete: () => {
        Notification.open('Fetching Comparison Result Table is Done.');
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSimulationVsTimeSeriesFormSubmit(simulationId: number, simulationConfiguration: any) {
    this._fetchResponse(new SimulationVsTimeSeriesRequest(simulationConfiguration, simulationId));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onExpectedVsTimeSeriesFormSubmit(expectedResults: any, simulationId: number) {
    this._fetchResponse(new ExpectedVsTimeSeriesRequest(expectedResults, simulationId));
  }

  onTimeSeriesVsTimeSeriesFormSubmit(firstSimulationId: number, secondSimulationId: number) {
    this._dynamicallyFetchResponse(new TimeSeriesVsTimeSeriesRequest(firstSimulationId, secondSimulationId));
  }

}
