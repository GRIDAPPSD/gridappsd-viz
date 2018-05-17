import * as React from 'react';
import { connect } from 'react-redux';

import { Plot } from './Plot';
import { AppState } from '../../models/AppState';
import { PlotModel } from '../../models/plot/PlotModel';
import { TimeSeries } from '../../models/plot/TimeSeries';
import { TimeSeriesDataPoint } from '../../models/plot/TimeSeriesDataPoint';
import { SimulationOutput } from '../../models/simulation-output/SimulationOutput';


interface Props {
  dispatch: any;
  simulationOutput: SimulationOutput;
  currentSimulationName: string;
}

interface State {
  plotModels: PlotModel[];
}

const mapStateToProps = (state: AppState): Props => ({
  simulationOutput: state.simulationOutput,
  currentSimulationName: state.activeSimulationConfig.simulation_config.simulation_name
} as Props);

const PLOT_NAMES_PER_SIMULATION_NAME = {
  ieee8500: {
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
  },
  ieee123: {
    voltage_A: ['53', '82', '610'],
    voltage_B: ['53', '82', '610'],
    voltage_C: ['53', '82', '610'],
    power_in_A: ['sw1'],
    power_in_B: ['sw1'],
    power_in_C: ['sw1'],
    tap_A: ['reg2', 'reg3', 'reg4'],
    tap_B: ['reg2', 'reg3', 'reg4'],
    tap_C: ['reg2', 'reg3', 'reg4']
  }
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
      const plotModels = Object.entries(PLOT_NAMES_PER_SIMULATION_NAME[this.props.currentSimulationName] as { [key: string]: string[] })
        .map(([plotName, timeSeriesNames]) => this._buildPlotModel(plotName, timeSeriesNames, newProps.simulationOutput));
      this.setState({ plotModels });
    }
  }
  render() {
    console.log(this.state.plotModels);
    return (
      this.state.plotModels.map(plotModel => <Plot key={plotModel.name} plotModel={plotModel} />)
    );
  }

  private _buildPlotModel(plotName: string, timeSeriesNames: string[], simulationOutput: SimulationOutput): PlotModel {
    return timeSeriesNames.map(timeSeriesName => this._buildTimeSeries(timeSeriesName, plotName, simulationOutput))
      .reduce((plotModel: PlotModel, timeSeries: TimeSeries) => {
        plotModel.timeSeries.push(timeSeries);
        return plotModel;
      }, { name: plotName, timeSeries: [] });
  }

  private _buildTimeSeries(timeSeriesName: string, plotName: string, simulationOutput: SimulationOutput): TimeSeries {
    const timeSeries: TimeSeries = TIME_SERIES[plotName + '_' + timeSeriesName] || { name: timeSeriesName, points: [] };
    if (timeSeries.points.length === 20)
      timeSeries.points.shift();
    timeSeries.points.push(this._getDataPointForTimeSeries(plotName, timeSeriesName, simulationOutput));
    TIME_SERIES[plotName + '_' + timeSeriesName] = timeSeries;
    return timeSeries;
  }

  private _getDataPointForTimeSeries(plotName: string, timeSeriesName: string, simulationOutput: SimulationOutput): TimeSeriesDataPoint {
    const dataPoint = { primitiveX: new Date(), primitiveY: 0 };
    if (plotName.includes('voltage')) {
      const measurement = simulationOutput.measurements.filter(
        measurement => measurement.connectivityNode === timeSeriesName && plotName.includes(measurement.phases) && measurement.magnitude !== undefined
      )[0];
      if (measurement) {
        dataPoint.primitiveY = measurement.magnitude;
      }
      else
        console.warn('No measurement found for time series "' + timeSeriesName + '", plot name "' + plotName + '", fncs output', simulationOutput);
    }
    else if (plotName.includes('power_in')) {
      const measurement = simulationOutput.measurements.filter(
        measurement => measurement.conductingEquipmentName === timeSeriesName && plotName.includes(measurement.phases) &&
          measurement.magnitude !== undefined && measurement.type === 'VA'
      )[0];
      if (measurement)
        dataPoint.primitiveY = measurement.magnitude;
      else
        console.warn('No measurement found for time series "' + timeSeriesName + '", plot name "' + plotName + '", fncs output', simulationOutput);
    }
    else if (plotName.includes('tap')) {
      const measurement = simulationOutput.measurements.filter(
        measurement => measurement.conductingEquipmentName === timeSeriesName && plotName.includes(measurement.phases) &&
          measurement.value !== undefined && measurement.type === 'Pos'
      )[0];
      if (measurement)
        dataPoint.primitiveY = measurement.value;
      else
        console.warn('No measurement found for time series "' + timeSeriesName + '", plot name "' + plotName + '", fncs output', simulationOutput);
    }
    return dataPoint;
  }
});