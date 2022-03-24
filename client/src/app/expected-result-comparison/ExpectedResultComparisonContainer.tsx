import { Component } from 'react';
import { Subscription } from 'rxjs';
import { map, finalize, takeWhile } from 'rxjs/operators';

import { ExpectedResultComparisonType } from '@client:common/ExpectedResultComparisonType';
import { StateStore } from '@client:common/state-store';
import { Notification } from '@client:common/overlay/notification';
import { StompClientService } from '@client:common/StompClientService';
import { MessageRequest } from '@client:common/MessageRequest';
import { FeederModel, ModelDictionaryComponent } from '@client:common/topology';

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
  feederModel: FeederModel;
  onMRIDChanged: (mRID: string) => void;
}

interface State {
  comparisonType: ExpectedResultComparisonType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comparisonResult: any[] | any;
  lineNames: string[];
  lineNamesAndMRIDMap: Map<string, string>;
  mRIDAndSimulationIdsMapping: Map<string, number[]>;
  componentType: string[];
  simulationIds: string[];
  isFetching: boolean;
  startFetchingAfterSubmit: boolean;
  noSufficientData: boolean;
  modelDictionaryComponentsCaches: ModelDictionaryComponent[];
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
      lineNames: [],
      lineNamesAndMRIDMap: this._setLineNamesAndMRIDMap(props.feederModel),
      mRIDAndSimulationIdsMapping: null,
      componentType: [],
      simulationIds: [],
      isFetching: false,
      startFetchingAfterSubmit: false,
      noSufficientData: false,
      modelDictionaryComponentsCaches: []
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
      this._setLineNamesAndExistingSimulationIdsMap();
    this._stateStoreSubscription = this._stateStore.select('modelDictionaryComponents')
    .subscribe({
      next: modelDicts => {
        this.setState({
          modelDictionaryComponentsCaches: modelDicts
        });
      }
    });
  }

  private _setLineNamesAndMRIDMap(feederModels: FeederModel) {
    const resultMap = new Map<string, string>();
    for (const feeder in feederModels) {
      if(Object.prototype.hasOwnProperty.call(feederModels, feeder)) {
        if(feederModels[feeder]['lines'].length > 1) {
          feederModels[feeder]['lines'].forEach((f) => {
            resultMap.set(f.name, f.id);
          });
        } else {
          resultMap.set(feederModels[feeder]['lines'][0].name, feederModels[feeder]['lines'][0].id);
        }
      }
    }
    return resultMap;
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

  private _setLineNamesAndExistingSimulationIdsMap() {
    const destinationTopic = 'goss.gridappsd.process.request.data.log';
    const responseTopic = '/simulation-ids';
    const requestBody = '{"query": "select process_id, substring(log_message, locate(\'_\', log_message, locate(\'Line_name\', log_message)+9),37) as model_id from log where source like \'%ProcessNewSimulationRequest%\' and log_message like \'%Line_name%\'"}';
    this._responseSubscription = this._stompClientService.readFrom<any>(responseTopic)
      .pipe(payload => payload)
      .subscribe({
        next: existingSimulationIdsAndMRIDs => {
          const allLineNameAndmMRIDsMap = new Map<string, string>();
          for (const feeder in this.props.feederModel) {
            if(Object.prototype.hasOwnProperty.call(this.props.feederModel, feeder)) {
              if(this.props.feederModel[feeder]['lines'].length > 1) {
                this.props.feederModel[feeder]['lines'].forEach((f) => {
                  allLineNameAndmMRIDsMap.set(f.name, f.id);
                });
              } else {
                allLineNameAndmMRIDsMap.set(this.props.feederModel[feeder]['lines'][0].name, this.props.feederModel[feeder]['lines'][0].id);
              }
            }
          }
          // filter out the existing LineName by allLineNameAndmMRIDsMap and existingSimulationIdsAndMRIDs
          const uniqueMRIDS = Array.from(new Set(existingSimulationIdsAndMRIDs.map((item: { model_id: string })=>item.model_id)));
          const existingLineNames = [];
          for(const mrid of uniqueMRIDS) {
            if(Array.from(allLineNameAndmMRIDsMap.values()).includes(mrid as string)){
              for(const[key,value] of allLineNameAndmMRIDsMap.entries()){
                if(value === mrid){
                  existingLineNames.push(key);
                }
              }
            }
          }
          const result = this._processExistingLineNamesAndSimulationIds(existingSimulationIdsAndMRIDs);
          this.setState({
            mRIDAndSimulationIdsMapping: result,
            lineNames: existingLineNames
          });
        }
      });
    this._stompClientService.send({
      destination: destinationTopic,
      body: requestBody,
      replyTo: responseTopic
    });
  }

  private _processExistingLineNamesAndSimulationIds(values: any) {
    const resultMap = new Map<string, number[]>(null);
    if(values && values.length > 0) {
      values.forEach((value: { model_id: string; process_id: number }) => {
        if(!resultMap.has(value.model_id)) {
          resultMap.set(value.model_id, [+value.process_id]);
        } else {
          const existingIds = resultMap.get(value.model_id);
          existingIds.push(+value.process_id);
          resultMap.set(value.model_id, existingIds);
        }
      });
    }
    return resultMap;
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
          startFetchingAfterSubmit={this.state.startFetchingAfterSubmit}
          noSufficientData={this.state.noSufficientData}
          result={this.state.comparisonResult}
          showProgressIndicator={this.state.isFetching}
          comparisonType={this.state.comparisonType}
          modelDictionaryComponentsCaches={this.state.modelDictionaryComponentsCaches} />
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
            lineName={this.state.lineNames}
            simulationIds={this.state.simulationIds}
            onMRIDChanged={this.props.onMRIDChanged}
            lineNamesAndMRIDMap={this.state.lineNamesAndMRIDMap}
            mRIDAndSimulationIdsMapping={this.state.mRIDAndSimulationIdsMapping}
            onSubmit={this.onTimeSeriesVsTimeSeriesFormSubmit} />
        );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSimulationVsExpectedFormSubmited(simulationConfiguration: any, expectedResults: any, events: any[]) {
    // this._fetchResponse(new SimulationVsExpectedRequest(simulationConfiguration, expectedResults, events));
    this._dynamicallyFetchResponse(new SimulationVsExpectedRequest(simulationConfiguration, expectedResults, events));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSimulationVsTimeSeriesFormSubmit(simulationId: number, simulationConfiguration: any) {
    this._fetchResponse(new SimulationVsTimeSeriesRequest(simulationConfiguration, simulationId));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onExpectedVsTimeSeriesFormSubmit(expectedResults: any, simulationId: number) {
    // this._fetchResponse(new ExpectedVsTimeSeriesRequest(expectedResults, simulationId));
    this._dynamicallyFetchResponse(new ExpectedVsTimeSeriesRequest(expectedResults, simulationId));
  }

  onTimeSeriesVsTimeSeriesFormSubmit(lineName: string, componentType: string, useMagnitude: boolean, useAngle: boolean, component: any, firstSimulationId: number, secondSimulationId: number) {
    // this._fetchResponse(new TimeSeriesVsTimeSeriesRequest(firstSimulationId, secondSimulationId));
    this._dynamicallyFetchResponseForTimeSeriesVsTimeSeries(new TimeSeriesVsTimeSeriesRequest(firstSimulationId, secondSimulationId), lineName, componentType, useMagnitude, useAngle, component);
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
        Notification.open('Fetching Comparison Result is Done.');
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

  private _dynamicallyFetchResponseForTimeSeriesVsTimeSeries(request: MessageRequest, lineName: string, componentType: string, useMagnitude: boolean, useAngle: boolean, component: any) {
    // Clear any existing/previous comparison result.
    this.setState({
      comparisonResult:[],
      startFetchingAfterSubmit: true
    });
    this._responseSubscription = this._stompClientService.readFrom<any[] | any>(request.replyTo)
    .pipe(
      takeWhile(data => data.status !== 'finish')
    )
    .subscribe({
      next: data => {
        this.setState({
          noSufficientData: false
        });
        if (data.status !== 'start' && component.measurementMRIDs.includes(data.object)) {
          if (!useMagnitude && !useAngle && data.attribute !== 'magnitude' && data.attribute !== 'angle') {
            this.setState({
              comparisonResult: [...this.state.comparisonResult, data],
              startFetchingAfterSubmit: false
            });
          } else if(useMagnitude && !useAngle && data.attribute === 'magnitude') {
            this.setState({
              comparisonResult: [...this.state.comparisonResult, data],
              startFetchingAfterSubmit: false
            });
          } else if (!useMagnitude && useAngle && data.attribute === 'angle') {
            this.setState({
              comparisonResult: [...this.state.comparisonResult, data],
              startFetchingAfterSubmit: false
            });
          } else if (useMagnitude && useAngle && (data.attribute === 'magnitude' || data.attribute === 'angle')) {
            this.setState({
              comparisonResult: [...this.state.comparisonResult, data],
              startFetchingAfterSubmit: false
            });
          }
        }
      },
      complete: () => {
        Notification.open('Fetching Comparison Result is Done.');
        if(this.state.comparisonResult.length < 2) {
          this.setState({
            noSufficientData: true
          });
        } else {
          this.setState({
            noSufficientData: false
          });
        }
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

}
