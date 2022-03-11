import { Component } from 'react';

import { LineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { MessageBanner } from '@client:common/overlay/message-banner';

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
  }>;
  noSufficientData: boolean;
  startFetchingAfterSubmit: boolean;
}

interface State {
  chartModels: LineChartModel[];
}

export class TimeSeriesVsTimeSeriesChartResult extends Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state={
      chartModels: []
    };
  }

  componentDidMount() {
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
