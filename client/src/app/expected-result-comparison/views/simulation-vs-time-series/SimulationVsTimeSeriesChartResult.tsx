import { Component } from 'react';

import { LineChart, LineChartModel, TimeSeries } from '@client:common/line-chart';
import { ProgressIndicator } from '@client:common/overlay/progress-indicator';
import { MessageBanner } from '@client:common/overlay/message-banner';


import './SimulationVsTimeSeriesChartResult.light.scss';
import './SimulationVsTimeSeriesChartResult.dark.scss';

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
  }>;
  noSufficientData: boolean;
  startFetchingAfterSubmit: boolean;
  phaseAndMeasurementMRIDMapping: Map<string[], string[]>;
}

interface State {
  chartModels: LineChartModel[];
}

export class SimulationVsTimeSeriesChartResult extends Component<Props, State> {
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
        if(datum.phase && datum.phase !== 'none' && datum.phase !== '') {
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
      <div className='simulation-vs-time-series-chart-result'>
        {(this.props.startFetchingAfterSubmit && !this.props.noSufficientData) ? <ProgressIndicator show /> : null}
        {
          !this.props.noSufficientData ? this.state.chartModels.map(model => {
            return (
              <LineChart
              key={model.name}
              lineChartModel={model} />
            );
          }) :  <MessageBanner>No sufficient data.</MessageBanner>
        }
      </div>
    );
  }
}
