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
        // console.log('after setPhases the datum is####');
        // console.log(datum);
        // actual: "1130014.134401547"
        // attribute: "magnitude"
        // diffMrid: "NA"
        // diffType: "NA"
        // expected: "1209751.9802748081"
        // indexOne: 1646924476
        // indexTwo: 1646924476
        // match: false
        // object: "_c16593db-3c64-4504-9387-17f19f558549"
        // phase: "A"
        // simulationTimestamp: 0
        if(!chartModelMap.has(datum.attribute)) {
          chartModelMap.set(datum.attribute, this._createLineChartModelForAttribute(datum.attribute));
        }
        const chartModel = chartModelMap.get(datum.attribute);
        const nextTimeStamp = new Date(anchorTimeStamp + chartModel.timeSeries[0].points.length + 1);
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
    if(this.props.modelDictionaryComponentsCaches && datum) {
        for (const [key, value] of this.state.phaseAndMeasurementMRIDMapping.entries()) {
          if (value.includes(datum.object)) {
            const index = value.indexOf(datum.object);
            datum['phase'] = key[index];
          }
        }
    }
    return datum;
  }

  private _createLineChartModelForAttribute(attribute: string): LineChartModel {
    return {
      name: attribute,
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
