import { Component } from 'react';

import { LineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { MessageBanner } from '@client:common/overlay/message-banner';


import './ExpectedVsTimeSeriesChartResult.light.scss';
import './ExpectedVsTimeSeriesChartResult.dark.scss';

interface Props {
  result: Array<{
    object: string;
    attribute: string;
    indexOne: number;
    indexTwo: number;
    simulationTimestamp: number;
    expected: string;
    actual: string;
    diffMrid: string;
    diffType: string;
    match: boolean;
    phase: string;
    componentName: string;
  }>;
  startFetchingAfterSubmit: boolean;
  phaseAndMeasurementMRIDMapping: Map<string[], string[]>;
}

interface State {
  chartModels: LineChartModel[];
  dataIsSufficient: boolean;
}

export class ExpectedVsTimeSeriesChartResult extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state={
      chartModels: [],
      dataIsSufficient: false
    };
  }

  componentDidMount() {
      this._buildChart();
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if(prevProps.result.length !== this.props.result.length) {
      this._buildChart();
    }
  }

  private _buildChart() {
    const chartModelMap = new Map<string, LineChartModel>();
    const anchorTimeStamp = Date.now();
    if(this.props.result.length > 0) {
      for(const datum of this.props.result) {
        this._matchPhaseToMeasurementMRID(datum);
        let chartTitle = '';
        if (datum.componentName && datum.componentName !== '') {
          chartTitle += datum.componentName + ' ';
        }
        if(datum.phase && datum.phase !== '') {
          chartTitle += datum.attribute + ' - phase ' + datum.phase;
        } else {
          chartTitle += datum.attribute;
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

        if (chartModel.timeSeries[0].points.length > 1 || chartModel.timeSeries[1].points.length > 1) {
          this.setState({
            dataIsSufficient: true
          });
        }
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

  private _matchPhaseToMeasurementMRID(datum: any) {
    if(datum && this.props.phaseAndMeasurementMRIDMapping !== null) {
      for (const [key, value] of this.props.phaseAndMeasurementMRIDMapping.entries()) {
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
      <div className='simulation-vs-expected-chart-result'>
        {
          this.state.chartModels.length === 0 && !this.props.startFetchingAfterSubmit
          ? <MessageBanner>No available data.</MessageBanner>
          : (this.props.startFetchingAfterSubmit && !this.state.dataIsSufficient)
            ? <ProgressIndicator show />
            : this.state.dataIsSufficient
              ? this.state.chartModels.sort((a, b) => a.name.localeCompare(b.name)).map(model => {
                return (
                  <LineChart
                  key={model.name}
                  lineChartModel={model} />
                );
              })
              : <MessageBanner>No sufficient data for rendering charts.</MessageBanner>
        }
      </div>
    );
  }
}
