/* eslint-disable no-console */
import { Component } from 'react';

// import { LineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';
import { LineChartModel, TimeSeries } from '@client:common/line-chart';


import './ExpectedVsTimeSeriesChartResult.light.scss';
import './ExpectedVsTimeSeriesChartResult.dark.scss';

interface Props {
  result: Array<{
    actual: string;
    attribute: string;
    diffMrid: string;
    diffType: string;
    expected: string;
    indexOne: number;
    indexTwo: number;
    match: boolean;
    object: string;
    simulationTimestamp: number;
  }>;
}

interface State {
  chartModels: LineChartModel[];
}

export class ExpectedVsTimeSeriesChartResult extends Component<Props, State> {
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
    if(prevProps.result.length !== this.props.result.length) {
    // if(prevProps.result.length !== this.props.result.length && this.props.result.length > 1) {
    // if(prevProps.result.length !== this.props.result.length) {
      // eslint-disable-next-line no-console
      // console.log('this.props.result====>', this.props.result);
      this._buildChart();
    }
  }

  private _buildChart() {
    const chartModelMap = new Map<string, LineChartModel>();
    const anchorTimeStamp = Date.now();
    console.log('this.props.result->>>>>>', this.props.result);
    if(this.props.result.length > 1) {
      for(const datum of this.props.result) {
        if(!chartModelMap.has(datum.attribute)) {
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
      this.setState({
        chartModels: [...chartModelMap.values()]
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
      // <div className='expected-vs-time-series-chart-result'>
      //   {
      //     this.state.chartModels.map(model => {
      //       return (
      //         <LineChart
      //         key={model.name}
      //         lineChartModel={model} />
      //       );
      //     })
      //   }
      // </div>
      <div className='expected-vs-time-series-chart-result'>
        <p>In the process of implementation...</p>
      </div>
    );
  }
}
