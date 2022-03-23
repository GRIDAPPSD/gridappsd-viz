import { Component } from 'react';

import { LineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { MessageBanner } from '@client:common/overlay/message-banner';
import { ModelDictionaryComponent } from '@client:common/topology';

import './TimeSeriesVsTimeSeriesChartResult.light.scss';
import './TimeSeriesVsTimeSeriesChartResult.dark.scss';

interface Props {
  result: Array<{
    object: string;
    attribute: 'angle' | 'magnitude' | 'value';
    indexOne: number;
    indexTwo: number;
    simulationTimestamp: number;
    expected: string;
    actual: string;
    diffMrid: string;
    diffType: string;
    match: boolean;
    phase: string;
  }>;
  noSufficientData: boolean;
  startFetchingAfterSubmit: boolean;
  modelDictionaryComponentsCaches: ModelDictionaryComponent[];
}

interface State {
  chartModels: LineChartModel[];
  phaseAndMeasurementMRIDMapping: Map<string[], string[]>;
}

export class TimeSeriesVsTimeSeriesChartResult extends Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state={
      chartModels: [],
      phaseAndMeasurementMRIDMapping: null
    };
  }

  componentDidMount() {
    this._createComponentMeasurementMRIDMapping(this.props.modelDictionaryComponentsCaches);
    this._buildChart();
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
      // if(prevProps.result.length !== this.props.result.length && this.props.result.length >= 4) {
      if(prevProps.result.length !== this.props.result.length && this.props.result.length >= 1) {
        this._buildChart();
      }
  }

  private _buildChart() {
    const chartModelMap = new Map<string, LineChartModel>();
    const anchorTimeStamp = Date.now();
    if(this.props.result.length > 1) {
      for(const datum of this.props.result) {
        this._matchPhaseToMeasurementMRID(datum);
        let chartTitle = '';
        if(datum.phase !== 'none' && datum.phase !== '') {
          chartTitle = datum.attribute + ' - phase ' + datum.phase;
        } else {
          chartTitle = datum.attribute;
        }
        if(!chartModelMap.has(chartTitle)) {
          chartModelMap.set(chartTitle, this._createLineChartModelForAttribute(chartTitle));
        }
        const chartModel = chartModelMap.get(chartTitle);
        const nextTimeStamp = new Date(anchorTimeStamp + chartModel.timeSeries[0].points.length * 1000);
        chartModel.timeSeries[0].points.push({
          timestamp: nextTimeStamp,
          measurement: +datum.expected
        });

        chartModel.timeSeries[1].points.push({
          timestamp: nextTimeStamp,
          measurement: +datum.actual
        });
      }
      this.setState({
        chartModels: [...chartModelMap.values()]
      });
    } else {
      this.setState({
        chartModels: []
      });
    }
  }

  private _createComponentMeasurementMRIDMapping(incomingModelDictionaryComponentsCaches: any[]) {
    const componentMeasurementMRIDMapping = new Map<string[], string[]>();
    if(incomingModelDictionaryComponentsCaches) {
      for(const modelDict in incomingModelDictionaryComponentsCaches) {
        if(Object.prototype.hasOwnProperty.call(incomingModelDictionaryComponentsCaches, modelDict)) {
          if(incomingModelDictionaryComponentsCaches[modelDict]['measurementMRIDs'].length > 0) {
            componentMeasurementMRIDMapping.set(
              incomingModelDictionaryComponentsCaches[modelDict].phases,
              incomingModelDictionaryComponentsCaches[modelDict].measurementMRIDs
            );
          }
        }
      }
    }
    this.setState({
      phaseAndMeasurementMRIDMapping: componentMeasurementMRIDMapping
    });
  }

  private _matchPhaseToMeasurementMRID(datum: any) {
    if(this.props.modelDictionaryComponentsCaches !== null && datum && this.state.phaseAndMeasurementMRIDMapping !== null) {
      for (const [key, value] of this.state.phaseAndMeasurementMRIDMapping.entries()) {
        if (value.includes(datum.object)) {
          const index = value.indexOf(datum.object);
          datum['phase'] = key[index];
        }
      }
    }
    return datum;
  }

  private _createLineChartModelForAttribute(chartTitle: string): LineChartModel {
    return {
      name: chartTitle,
      yAxisLabel: '',
      timeSeries: [
        this._createTimeSeries('expected'),
        this._createTimeSeries('actual')
      ]
    };
  }

  private _createTimeSeries(timeSeriesName: 'actual' | 'expected'): TimeSeries {
    return {
      name: timeSeriesName,
      points: []
    };
  }

  render() {
    return (
      <div className='time-series-vs-time-series-chart-result'>
        {(this.props.startFetchingAfterSubmit && !this.props.noSufficientData) ? <ProgressIndicator show /> : null}
        {
          !this.props.noSufficientData ? this.state.chartModels.map(model => {
            return (
              <LineChart
              key={model.name}
              lineChartModel={model} />
            );
          }) : <MessageBanner>No sufficient data, please view results in table.</MessageBanner>
        }
      </div>
    );
  }

}
