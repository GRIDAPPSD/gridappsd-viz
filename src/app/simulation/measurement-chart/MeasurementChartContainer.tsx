import * as React from 'react';
import { Subscription } from 'rxjs';

import { MeasurementChart } from './MeasurementChart';
import { MeasurementChartModel } from './models/MeasurementChartModel';
import { SimulationOutputMeasurement, SimulationOutputService, SimulationQueue } from '@shared/simulation';
import { TimeSeries } from './models/TimeSeries';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';


interface Props {
}

interface State {
  measurementChartModels: MeasurementChartModel[];
}

const GRAPH_NAMES_PER_SIMULATION_NAME = {
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
    power_in_A: ['reg1a'],
    power_in_B: ['reg1a'],
    power_in_C: ['reg1a'],
    tap_A: ['reg2', 'reg3', 'reg4'],
    tap_B: ['reg2', 'reg3', 'reg4'],
    tap_C: ['reg2', 'reg3', 'reg4']
  },
  ieee123pv: {
    voltage_A: ['53', '82', '62'],
    voltage_B: ['53', '82', '62'],
    voltage_C: ['53', '82', '62'],
    power_in_A: ['reg1a'],
    power_in_B: ['reg1a'],
    power_in_C: ['reg1a'],
    tap_A: ['reg2', 'reg3', 'reg4'],
    tap_B: ['reg2', 'reg3', 'reg4'],
    tap_C: ['reg2', 'reg3', 'reg4']
  },
  ieee8500new_335: {
    voltage_A: [
      'hvmv11sub1_lsb',
      'l2673313',
      'l2876814',
      'l2955047',
      'l3160107',
      'l3254238',
      'm1047574'

    ],
    voltage_B: [
      'hvmv11sub1_lsb',
      'l2673313',
      'l2876814',
      'l2955047',
      'l3160107',
      'l3254238',
      'm1047574'
    ],
    voltage_C: [
      'hvmv11sub1_lsb',
      'l2673313',
      'l2876814',
      'l2955047',
      'l3160107',
      'l3254238',
      'm1047574'
    ],
    power_in_A: [
      'hvmv69_11sub3'
    ],
    power_in_B: [
      'hvmv69_11sub3'
    ],
    power_in_C: [
      'hvmv69_11sub3'
    ],
    tap_A: [
      'feeder_reg1c'
    ],
    tap_B: [
      'feeder_reg1c'
    ],
    tap_C: [
      'feeder_reg1c'
    ]
  }
};

export class MeasurementChartContainer extends React.Component<Props, State> {

  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _simulationQueue = SimulationQueue.getInstance();
  private _timeSeries: { [seriesName: string]: TimeSeries } = {};
  private _simulationOutputMeasurementsStream: Subscription;

  constructor(props: any) {
    super(props);
    this.state = {
      measurementChartModels: []
    };
  }

  componentDidMount() {
    this._simulationOutputMeasurementsStream = this._subscribeToSimulationOutputMeasurementsStream();
  }

  private _subscribeToSimulationOutputMeasurementsStream(): Subscription {
    const simulationName = this._simulationQueue.getActiveSimulation().name;
    return this._simulationOutputService.simulationOutputMeasurementsReceived()
      .subscribe(measurements => {
        const measurementChartModels = Object.entries(GRAPH_NAMES_PER_SIMULATION_NAME[simulationName] as { [key: string]: string[] })
          .map(([graphName, timeSeriesNames]) => this._buildPlotModel(graphName, timeSeriesNames, measurements));
        this.setState({ measurementChartModels });
      });
  }

  private _buildPlotModel(graphName: string, timeSeriesNames: string[], measurements: SimulationOutputMeasurement[]): MeasurementChartModel {
    return timeSeriesNames.map(timeSeriesName => this._buildTimeSeries(graphName, timeSeriesName, measurements))
      .reduce((measurementChartModel: MeasurementChartModel, timeSeries: TimeSeries) => {
        measurementChartModel.timeSeries.push(timeSeries);
        return measurementChartModel;
      }, { name: graphName, timeSeries: [] });
  }

  private _buildTimeSeries(graphName: string, timeSeriesName: string, measurements: SimulationOutputMeasurement[]): TimeSeries {
    const timeSeries: TimeSeries = this._timeSeries[graphName + '_' + timeSeriesName] || { name: timeSeriesName, points: [] };
    if (timeSeries.points.length === 20)
      timeSeries.points.shift();
    timeSeries.points.push(this._getDataPointForTimeSeries(graphName, timeSeriesName, measurements));
    this._timeSeries[graphName + '_' + timeSeriesName] = timeSeries;
    return timeSeries;
  }

  private _getDataPointForTimeSeries(graphName: string, timeSeriesName: string, measurements: SimulationOutputMeasurement[]): TimeSeriesDataPoint {
    const dataPoint = { primitiveX: new Date(), primitiveY: 0 };
    if (graphName.includes('voltage')) {
      const measurement = measurements.filter(
        measurement => measurement.connectivityNode === timeSeriesName && graphName.includes(measurement.phases) && measurement.type === 'PNV' && measurement.magnitude !== undefined
      )[0];
      if (measurement)
        dataPoint.primitiveY = measurement.magnitude;
      else
        console.warn(`No measurement found for time series "${timeSeriesName}", plot name "${graphName}"`);
    }
    else if (graphName.includes('power_in')) {
      const measurement = measurements.filter(
        measurement => measurement.conductingEquipmentName === timeSeriesName && graphName.includes(measurement.phases) &&
          measurement.magnitude !== undefined && measurement.type === 'VA'
      )[0];
      if (measurement)
        dataPoint.primitiveY = measurement.magnitude;
      else
        console.warn(`No measurement found for time series "${timeSeriesName}", plot name "${graphName}"`);
    }
    else if (graphName.includes('tap')) {
      const measurement = measurements.filter(
        measurement => measurement.conductingEquipmentName === timeSeriesName && graphName.includes(measurement.phases) &&
          measurement.value !== undefined && measurement.type === 'Pos'
      )[0];
      if (measurement)
        dataPoint.primitiveY = measurement.value;
      else
        console.warn(`No measurement found for time series "${timeSeriesName}", plot name "${graphName}"`);
    }
    return dataPoint;
  }

  componentWillUnmount() {
    this._simulationOutputMeasurementsStream.unsubscribe();
  }

  render() {
    return (
      this.state.measurementChartModels.map(measurementChartModel => <MeasurementChart key={measurementChartModel.name} measurementChartModel={measurementChartModel} />)
    );
  }

}