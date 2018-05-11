import * as React from 'react';
import { connect } from 'react-redux';

import { Plot } from './Plot';
import { AppState } from '../../models/AppState';
import { PlotModel } from '../../models/plot/PlotModel';
import { TimeSeries } from '../../models/plot/TimeSeries';
import { TimeSeriesDataPoint } from '../../models/plot/TimeSeriesDataPoint';
import { FncsOutput } from '../../models/fncs-output/FncsOutput';


interface Props {
  dispatch: any;
  fncsOutput: FncsOutput;
}

interface State {
  plotModels: PlotModel[];
}

const mapStateToProps = (state: AppState): Props => ({
  fncsOutput: state.fncsOutput
} as Props);

const PLOT_NAME_MAP = {
  voltage_A: [
    '190-7361',
    '190-8581',
    '190-8593',
    '_hvmv_sub_lsb',
    'l2673313',
    'l2876814',
    'l2955047',
    'l3160107',
    'l3254238',
    'm1047574',
  ],

  voltage_B: [
    '190-7361',
    '190-8581',
    '190-8593',
    '_hvmv_sub_lsb',
    'l2673313',
    'l2876814',
    'l2955047',
    'l3160107',
    'l3254238',
    'm1047574',
  ],

  voltage_C: [
    '190-7361',
    '190-8581',
    '190-8593',
    '_hvmv_sub_lsb',
    'l2673313',
    'l2876814',
    'l2955047',
    'l3160107',
    'l3254238',
    'm1047574',
  ],
  power_in_A: [
    'hvmv_sub'
  ],
  power_in_B: [
    'hvmv_sub'
  ],
  power_in_C: [
    'hvmv_sub'
  ],

  tap_A: [
    'FEEDER_REG',
    'VREG2',
    'VREG3',
    'VREG4'
  ],

  tap_B: [
    'FEEDER_REG',
    'VREG2',
    'VREG3',
    'VREG4'
  ],

  tap_C: [
    'FEEDER_REG',
    'VREG2',
    'VREG3',
    'VREG4'
  ]
};

const TIME_SERIES: { [seriesName: string]: TimeSeries } = {};

export const PlotContainer = connect(mapStateToProps)(class PlotContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      plotModels: []
    };
  }

  componentWillReceiveProps(newProps: Props) {
    if (this.props !== newProps) {
      console.log(newProps.fncsOutput);
      const plotModels = Object.entries(PLOT_NAME_MAP)
        .map(([plotName, timeSeriesNames]) => this._buildPlotModel(plotName, timeSeriesNames, newProps.fncsOutput));
      this.setState({ plotModels });
    }
  }
  render() {
    console.log(this.state.plotModels);
    return (
      this.state.plotModels.map(plotModel => <Plot key={plotModel.name} plotModel={plotModel} />)
    );
  }

  private _buildPlotModel(plotName: string, timeSeriesNames: string[], fncsOutput: FncsOutput): PlotModel {
    return timeSeriesNames.map(timeSeriesName => this._buildTimeSeries(timeSeriesName, plotName, fncsOutput))
      .reduce((plotModel: PlotModel, timeSeries: TimeSeries) => {
        plotModel.timeSeries.push(timeSeries);
        return plotModel;
      }, { name: plotName, timeSeries: [] });
  }

  private _buildTimeSeries(timeSeriesName: string, plotName: string, fncsOutput: FncsOutput): TimeSeries {
    const timeSeries: TimeSeries = TIME_SERIES[plotName + '_' + timeSeriesName] || { name: timeSeriesName, points: [] };
    if (timeSeries.points.length === 20)
      timeSeries.points.shift();
    timeSeries.points.push(this._getDataPointForTimeSeries(plotName, timeSeriesName, fncsOutput));
    TIME_SERIES[plotName + '_' + timeSeriesName] = timeSeries;
    return timeSeries;
  }

  private _getDataPointForTimeSeries(plotName: string, timeSeriesName: string, fncsOutput: FncsOutput): TimeSeriesDataPoint {
    const dataPoint = { primitiveX: new Date(), primitiveY: 0 };
    if (plotName.includes('voltage')) {
      const measurement = fncsOutput.measurements.filter(
        measurement => measurement.connectivityNode === timeSeriesName && plotName.includes(measurement.phases) && measurement.magnitude !== undefined
      )[0];
      if (measurement) {
        dataPoint.primitiveY = Math.sqrt(Math.pow(measurement.magnitude, 2) + Math.pow(measurement.angle, 2));
      }
      else
        console.warn('No measurement found for time series "' + timeSeriesName + '", plot name "' + plotName + '", fncs output', fncsOutput);
    }
    else if (plotName.includes('power_in')) {
      const measurement = fncsOutput.measurements.filter(
        measurement => measurement.conductingEquipmentName === timeSeriesName && plotName.includes(measurement.phases) && measurement.magnitude !== undefined
      )[0];
      if (measurement && measurement.type === 'PNV')
        dataPoint.primitiveY = Math.sqrt(Math.pow(measurement.magnitude, 2) + Math.pow(measurement.angle, 2));
      else
        console.warn('No measurement found for time series "' + timeSeriesName + '", plot name "' + plotName + '", fncs output', fncsOutput);
    }
    else if (plotName.includes('tap')) {
      const measurement = fncsOutput.measurements.filter(
        measurement => measurement.conductingEquipmentName === timeSeriesName && plotName.includes(measurement.phases) && measurement.value !== undefined
      )[0];
      if (measurement && measurement.type === 'Pos')
        dataPoint.primitiveY = measurement.value;
      else
        console.warn('No measurement found for time series "' + timeSeriesName + '", plot name "' + plotName + '", fncs output', fncsOutput);
    }
    return dataPoint;
  }
});