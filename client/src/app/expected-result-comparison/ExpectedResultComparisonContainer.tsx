import { Component } from 'react';
import { Subject, Subscription } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';
import { isEqual } from 'lodash';

import { ExpectedResultComparisonType } from '@client:common/ExpectedResultComparisonType';
import { StateStore } from '@client:common/state-store';
import { Notification } from '@client:common/overlay/notification';
import { StompClientService } from '@client:common/StompClientService';
import { MessageRequest } from '@client:common/MessageRequest';
import { FeederModel, MeasurementType, ModelDictionaryComponent } from '@client:common/topology';

import { ComponentModel } from './models/ComponentModel';
import { ComparisonResult } from './models/ComparisonResult';
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
  filteredComparisonResult: ComparisonResult[];
  allComparisonResult: ComparisonResult[];
  lineNames: string[];
  lineNamesAndMRIDMap: Map<string, string>;
  mRIDAndSimulationIdsMapping: Map<string, number[]>;
  simulationIds: string[];
  isFetching: boolean;
  startFetchingAfterSubmit: boolean;
  modelDictionaryComponentsCaches: ModelDictionaryComponent[];
  phaseAndMeasurementMRIDMapping: Map<string[], string[]>;
  selectedMenuValues: {
    componentType: string;
    useMagnitude: boolean;
    useAngle: boolean;
    component: ComponentModel[];
  };
}

export class ExpectedResultComparisonContainer extends Component<Props, State> {

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _responseSubscription: Subscription;
  private _unsubscriber = new Subject<void>();

  // SimulationVsExpected
  private _sELineName = '';
  private _sEExpectedResults: any = null;
  private _sESimulationConfiguration: any = null;

  // SimulationVsTimeSeries
  private _selectedSTLineName = '';
  private _selectedSTSimulationId = '';
  private _sTSimulationConfiguration: any = null;

  // ExpectedVsTimeSeries
  private _selectedETLineName = '';
  private _selectedETSimulationId = '';
  private _eTEexpectedResults: any = null;

  // TimeSeriesVsTimeSeries
  private _selectedTTLineName = '';
  private _selectedTTFirstSimulationId = '';
  private _selectedTTSecondSimulationId = '';

  constructor(props: Props) {
    super(props);

    this.state = {
      comparisonType: null,
      filteredComparisonResult: [],
      allComparisonResult: [],
      lineNames: [],
      lineNamesAndMRIDMap: this._setLineNamesAndMRIDMap(props.feederModel),
      mRIDAndSimulationIdsMapping: null,
      simulationIds: [],
      isFetching: false,
      startFetchingAfterSubmit: false,
      modelDictionaryComponentsCaches: [],
      phaseAndMeasurementMRIDMapping: null,
      selectedMenuValues: {
        componentType: '',
        useMagnitude: false,
        useAngle: false,
        component: null
      }
    };

    this.onSimulationVsExpectedFormSubmited = this.onSimulationVsExpectedFormSubmited.bind(this);
    this.onSimulationVsTimeSeriesFormSubmit = this.onSimulationVsTimeSeriesFormSubmit.bind(this);
    this.onExpectedVsTimeSeriesFormSubmit = this.onExpectedVsTimeSeriesFormSubmit.bind(this);
    this.onTimeSeriesVsTimeSeriesFormSubmit = this.onTimeSeriesVsTimeSeriesFormSubmit.bind(this);
  }

  componentDidMount() {
    this._stateStore.select('expectedResultComparisonType')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: selectedType => {
          this.setState({
            comparisonType: selectedType
          });
        }
      });
    this._setLineNamesAndExistingSimulationIdsMap();
    this._stateStore.select('modelDictionaryComponents')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: modelDicts => {
          if (modelDicts) {
            const componentMeasurementMRIDMapping = new Map<string[], string[]>();
            for(const modelDict in modelDicts) {
              if (Object.prototype.hasOwnProperty.call(modelDicts, modelDict)) {
                componentMeasurementMRIDMapping.set(
                  modelDicts[modelDict].phases,
                  modelDicts[modelDict].measurementMRIDs
                );
              }
            }
            this.setState({
              modelDictionaryComponentsCaches: modelDicts,
              phaseAndMeasurementMRIDMapping: componentMeasurementMRIDMapping
            });
          }
        }
      });
  }

  componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
    if (prevState.selectedMenuValues !== this.state.selectedMenuValues) {
      this._filterExistingComparisonResult();
    }
  }

  private _setLineNamesAndMRIDMap(feederModels: FeederModel) {
    const resultMap = new Map<string, string>();
    for (const feeder in feederModels) {
      if (Object.prototype.hasOwnProperty.call(feederModels, feeder)) {
        if (feederModels[feeder]['lines'].length > 1) {
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

  private _setLineNamesAndExistingSimulationIdsMap() {
    const destinationTopic = 'goss.gridappsd.process.request.data.log';
    const responseTopic = '/simulation-ids';
    const requestBody = '{"query": "select process_id, substring(log_message, locate(\'_\', log_message, locate(\'Line_name\', log_message)+9),37) as model_id from log where source like \'%ProcessNewSimulationRequest%\' and log_message like \'%Line_name%\'"}';
    this._stompClientService.readFrom<any>(responseTopic)
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: existingSimulationIdsAndMRIDs => {
          const allLineNameAndMRIDsMap = new Map<string, string>();
          for (const feeder in this.props.feederModel) {
            if (Object.prototype.hasOwnProperty.call(this.props.feederModel, feeder)) {
              if (this.props.feederModel[feeder]['lines'].length > 1) {
                this.props.feederModel[feeder]['lines'].forEach((f) => {
                  allLineNameAndMRIDsMap.set(f.name, f.id);
                });
              } else {
                allLineNameAndMRIDsMap.set(this.props.feederModel[feeder]['lines'][0].name, this.props.feederModel[feeder]['lines'][0].id);
              }
            }
          }
          // filter out the existing LineName by allLineNameAndMRIDsMap and existingSimulationIdsAndMRIDs
          const uniqueMRIDS = Array.from(new Set(existingSimulationIdsAndMRIDs.map((item: { model_id: string })=> item.model_id)));
          const uniqueSimulationIds = Array.from(new Set(existingSimulationIdsAndMRIDs.map((item: {process_id: string}) => item.process_id)));
          const existingLineNames = [];
          for(const mrid of uniqueMRIDS) {
            if (Array.from(allLineNameAndMRIDsMap.values()).includes(mrid as string)){
              for(const[key,value] of allLineNameAndMRIDsMap.entries()){
                if (value === mrid){
                  existingLineNames.push(key);
                }
              }
            }
          }
          const result = this._processExistingLineNamesAndSimulationIds(existingSimulationIdsAndMRIDs);
          this.setState({
            mRIDAndSimulationIdsMapping: result,
            lineNames: existingLineNames,
            simulationIds: uniqueSimulationIds as string[]
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
    if (values && values.length > 0) {
      values.forEach((value: { model_id: string; process_id: number }) => {
        if (!resultMap.has(value.model_id)) {
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
    this._responseSubscription?.unsubscribe();
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      <div className='expected-result-comparison'>
        {this.selectComponentBasedComparisonType()}
        <ResultViewer
          startFetchingAfterSubmit={this.state.startFetchingAfterSubmit}
          result={this.state.filteredComparisonResult}
          showProgressIndicator={this.state.isFetching}
          comparisonType={this.state.comparisonType}
          phaseAndMeasurementMRIDMapping={this.state.phaseAndMeasurementMRIDMapping}
          modelDictionaryComponentsCaches={this.state.modelDictionaryComponentsCaches} />
      </div>
    );
  }

  selectComponentBasedComparisonType() {
    switch (this.state.comparisonType) {
      case ExpectedResultComparisonType.SIMULATION_VS_EXPECTED:
        return (
          <SimulationVsExpected
          lineName={this.state.lineNames}
          simulationIds={this.state.simulationIds}
          onMRIDChanged={this.props.onMRIDChanged}
          lineNamesAndMRIDMap={this.state.lineNamesAndMRIDMap}
          mRIDAndSimulationIdsMapping={this.state.mRIDAndSimulationIdsMapping}
          onSubmit={this.onSimulationVsExpectedFormSubmited}
          modelDictionaryComponentsCaches={this.state.modelDictionaryComponentsCaches} />
        );

      case ExpectedResultComparisonType.SIMULATION_VS_TIME_SERIES:
        return (
          <SimulationVsTimeSeries
            lineName={this.state.lineNames}
            simulationIds={this.state.simulationIds}
            onMRIDChanged={this.props.onMRIDChanged}
            lineNamesAndMRIDMap={this.state.lineNamesAndMRIDMap}
            mRIDAndSimulationIdsMapping={this.state.mRIDAndSimulationIdsMapping}
            onSubmit={this.onSimulationVsTimeSeriesFormSubmit} />
        );

      case ExpectedResultComparisonType.EXPECTED_VS_TIME_SERIES:
        return (
          <ExpectedVsTimeSeries
            modelDictionaryComponentsCaches={this.state.modelDictionaryComponentsCaches}
            lineName={this.state.lineNames}
            simulationIds={this.state.simulationIds}
            onMRIDChanged={this.props.onMRIDChanged}
            lineNamesAndMRIDMap={this.state.lineNamesAndMRIDMap}
            mRIDAndSimulationIdsMapping={this.state.mRIDAndSimulationIdsMapping}
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

  // No events parameter for now
  onSimulationVsExpectedFormSubmited(simulationConfiguration: any, expectedResults: any, lineName: string, componentType: string, useMagnitude: boolean, useAngle: boolean, component: ComponentModel[]) {
    if(!isEqual(simulationConfiguration, this._sESimulationConfiguration) || !isEqual(expectedResults, this._sEExpectedResults) || lineName !== this._sELineName ) {
      this._dynamicallyFetchComparisonResponse(new SimulationVsExpectedRequest(simulationConfiguration, expectedResults), lineName, componentType, useMagnitude, useAngle, component);
    } else {
      this.setState({
        selectedMenuValues: {
          componentType,
          useMagnitude,
          useAngle,
          component
        }
      });
    }
    this._sELineName = lineName;
    this._sEExpectedResults = expectedResults;
    this._sESimulationConfiguration = simulationConfiguration;
  }

  onSimulationVsTimeSeriesFormSubmit(simulationConfiguration: any, simulationId: number, lineName: string, componentType: string, useMagnitude: boolean, useAngle: boolean, component: any) {
    if(!isEqual(simulationConfiguration, this._sTSimulationConfiguration) || lineName !== this._selectedSTLineName || simulationId !== +this._selectedSTSimulationId) {
      this._dynamicallyFetchComparisonResponse(new SimulationVsTimeSeriesRequest(simulationConfiguration, simulationId), lineName, componentType, useMagnitude, useAngle, component);
    } else {
      this.setState({
        selectedMenuValues: {
          componentType,
          useMagnitude,
          useAngle,
          component
        }
      });
    }
    this._selectedSTLineName = lineName;
    this._selectedSTSimulationId = simulationId.toString();
    this._sTSimulationConfiguration = simulationConfiguration;
  }

  onExpectedVsTimeSeriesFormSubmit(expectedResults: any, simulationId: number, lineName: string, componentType: string, useMagnitude: boolean, useAngle: boolean, component: any) {
    if (!isEqual(expectedResults, this._eTEexpectedResults) || lineName !== this._selectedETLineName || simulationId !== +this._selectedETSimulationId) {
      this._dynamicallyFetchComparisonResponse(new ExpectedVsTimeSeriesRequest(expectedResults, simulationId), lineName, componentType, useMagnitude, useAngle, component);
    } else {
      this.setState({
        selectedMenuValues: {
          componentType,
          useMagnitude,
          useAngle,
          component
        }
      });
    }
    this._selectedETLineName = lineName;
    this._selectedETSimulationId = simulationId.toString();
    this._eTEexpectedResults = expectedResults;
  }

  onTimeSeriesVsTimeSeriesFormSubmit(lineName: string, componentType: string, useMagnitude: boolean, useAngle: boolean, component: any, firstSimulationId: number, secondSimulationId: number) {
    if (lineName !== this._selectedTTLineName || firstSimulationId !== +this._selectedTTFirstSimulationId || secondSimulationId !== +this._selectedTTSecondSimulationId) {
      this._dynamicallyFetchComparisonResponse(new TimeSeriesVsTimeSeriesRequest(firstSimulationId, secondSimulationId), lineName, componentType, useMagnitude, useAngle, component);
    } else {
      this.setState({
        selectedMenuValues: {
          componentType,
          useMagnitude,
          useAngle,
          component
        }
      });
    }
    this._selectedTTLineName = lineName;
    this._selectedTTFirstSimulationId = firstSimulationId.toString();
    this._selectedTTSecondSimulationId = secondSimulationId.toString();
  }

  private _dynamicallyFetchComparisonResponse(request: MessageRequest, lineName: string, componentType: string, useMagnitude: boolean, useAngle: boolean, component: ComponentModel[]) {

    const payload = [] as ComparisonResult[];
    let allMeasurementMRIDs: string | string[] = [];
    let modelComponentDictNameAndMeasurementMRIDsMap = new Map<string, string>(null);

    allMeasurementMRIDs = this._extractComponentMeasurementMRIDs(component);
    modelComponentDictNameAndMeasurementMRIDsMap = this._createResultObjectAndComponentNameMapping(this.state.modelDictionaryComponentsCaches);

    // Clear any existing/previous comparison result.
    this.setState({
      filteredComparisonResult:[],
      startFetchingAfterSubmit: true
    });
    this._responseSubscription = this._stompClientService.readFrom<any[] | any>(request.replyTo)
    .pipe(
      takeWhile(data => data.status !== 'finish')
    )
    .subscribe({
      next: data => {
        if (data.status !== 'start') {
          this._addComponentNameToResultData(data, modelComponentDictNameAndMeasurementMRIDsMap);
          payload.push(data);
          if (allMeasurementMRIDs && allMeasurementMRIDs.length > 0) {
            if (allMeasurementMRIDs.includes(data.object)) {
              this._responseFilter(componentType, useMagnitude, useAngle, data);
            }
          }
        }
      },
      complete: () => {
        Notification.open('Fetching Comparison Result is Done.');
        this.setState({
          startFetchingAfterSubmit: false,
          allComparisonResult: payload
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

  private _extractComponentMeasurementMRIDs(component: ComponentModel[]) {
    let selectedComponentMeasurementMRIDs: any[] = [];
    selectedComponentMeasurementMRIDs = [].concat(...component.map((c) => c.measurementMRIDs));
    return selectedComponentMeasurementMRIDs;
  }

  private _createResultObjectAndComponentNameMapping(components: ModelDictionaryComponent[]) {
    const modelComponentDictNameAndMeasurementMRIDs = new Map<string, string>();
    for(const component in components) {
      if (Object.prototype.hasOwnProperty.call(components, component)) {
        components[component].measurementMRIDs.forEach((mrid) => {
          modelComponentDictNameAndMeasurementMRIDs.set(mrid, components[component].name);
        });
      }
    }
    return modelComponentDictNameAndMeasurementMRIDs;
  }

  private _addComponentNameToResultData(data: any, modelComponentDictNameAndMeasurementMRIDsMap: Map<string, string>) {
    if(modelComponentDictNameAndMeasurementMRIDsMap.get(data.object)) {
      data['componentName'] = modelComponentDictNameAndMeasurementMRIDsMap.get(data.object);
    }
  }

  private _filterExistingComparisonResult() {
    const { useMagnitude, useAngle, component, componentType } = this.state.selectedMenuValues;
    const existingComparisonResult = this.state.allComparisonResult;
    let allMeasurementMRIDs: string | string[] = [];
    allMeasurementMRIDs = this._extractComponentMeasurementMRIDs(component);
    const foundResult: ComparisonResult[] = [];
    existingComparisonResult.forEach((result) => {
      if (allMeasurementMRIDs.includes(result.object)) {
        if (componentType === MeasurementType.TAP && result.attribute === 'value') {
          foundResult.push(result);
        } else if (!useMagnitude && !useAngle && result.attribute !== 'magnitude' && result.attribute !== 'angle') {
          foundResult.push(result);
        } else if (useMagnitude && !useAngle && result.attribute === 'magnitude') {
          foundResult.push(result);
        } else if (!useMagnitude && useAngle && result.attribute === 'angle') {
          foundResult.push(result);
        } else if (useMagnitude && useAngle && (result.attribute === 'magnitude' || result.attribute === 'angle')) {
          foundResult.push(result);
        }
      }
      this.setState({
        filteredComparisonResult: foundResult
      });
    });
  }

  private _responseFilter(componentType: string, useMagnitude: boolean, useAngle: boolean, data: any) {
    if (componentType === MeasurementType.TAP && data.attribute === 'value') {
      this.setState({
        filteredComparisonResult: [...this.state.filteredComparisonResult, data]
      });
    } else if (!useMagnitude && !useAngle && data.attribute !== 'magnitude' && data.attribute !== 'angle') {
      this.setState({
        filteredComparisonResult: [...this.state.filteredComparisonResult, data]
      });
    } else if (useMagnitude && !useAngle && data.attribute === 'magnitude') {
      this.setState({
        filteredComparisonResult: [...this.state.filteredComparisonResult, data]
      });
    } else if (!useMagnitude && useAngle && data.attribute === 'angle') {
      this.setState({
        filteredComparisonResult: [...this.state.filteredComparisonResult, data]
      });
    } else if (useMagnitude && useAngle && (data.attribute === 'magnitude' || data.attribute === 'angle')) {
      this.setState({
        filteredComparisonResult: [...this.state.filteredComparisonResult, data]
      });
    }
  }

}
