import { Component } from 'react';

import { LineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';

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
}

interface State {
  chartModels: LineChartModel[];
}

export class TimeSeriesVsTimeSeriesChartResult extends Component<Props, State> {

  constructor(props: Props) {
    super(props);

    const chartModelMap = new Map<string, LineChartModel>();
    const anchorTimeStamp = Date.now();

    for (const datum of props.result) {
      if (!chartModelMap.has(datum.attribute)) {
        chartModelMap.set(datum.attribute, this._createLineChartModelForAttribute(datum.attribute));
      }
      const chartModel = chartModelMap.get(datum.attribute);
      const expectedValueTimeSeries = chartModel.timeSeries[0];
      const actualValueTimeSeries = chartModel.timeSeries[1];
      const nextTimeStamp = new Date(anchorTimeStamp + expectedValueTimeSeries.points.length + 1);

      expectedValueTimeSeries.points.push({
        timestamp: nextTimeStamp,
        measurement: +datum.expected
      });

      actualValueTimeSeries.points.push({
        timestamp: nextTimeStamp,
        measurement: +datum.actual
      });
    }

    this.state = {
      chartModels: [...chartModelMap.values()]
    };
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
        {
          this.state.chartModels.map(model => (
            <LineChart
              key={model.name}
              lineChartModel={model} />
          ))
        }
      </div>
    );
  }

}
