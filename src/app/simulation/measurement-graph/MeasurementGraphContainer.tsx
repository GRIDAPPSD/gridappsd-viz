import * as React from 'react';
import { Subscription } from 'rxjs';

import { MeasurementGraph } from './MeasurementGraph';
import { MeasurementGraphModel } from './models/MeasurementGraphModel';
import { TimeSeries } from './models/TimeSeries';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { SimulationOutputMeasurement } from '../../models/simulation-output/SimulationOutputMeasurement';
import { SimulationOutputService } from '../../services/SimulationOutputService';


interface Props {
  simulationName: string;
}

interface State {
  measurementGraphModels: MeasurementGraphModel[];
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
  }
};

export class MeasurementGraphContainer extends React.Component<Props, State> {

  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private _timeSeries: { [seriesName: string]: TimeSeries } = {};
  private _simulationOutputMeasurementsStream: Subscription;

  constructor(props: any) {
    super(props);
    this.state = {
      measurementGraphModels: []
    };
  }

  componentDidMount() {
    this._simulationOutputMeasurementsStream = this._subscribeToSimulationOutputMeasurementsStream();
  }

  componentWillUnmount() {
    this._simulationOutputMeasurementsStream.unsubscribe();
  }

  render() {
    return (
      this.state.measurementGraphModels.map(measurementGraphModel => <MeasurementGraph key={measurementGraphModel.name} measurementGraphModel={measurementGraphModel} />)
    );
  }

  private _buildPlotModel(graphName: string, timeSeriesNames: string[], measurements: SimulationOutputMeasurement[]): MeasurementGraphModel {
    return timeSeriesNames.map(timeSeriesName => this._buildTimeSeries(graphName, timeSeriesName, measurements))
      .reduce((measurementGraphModel: MeasurementGraphModel, timeSeries: TimeSeries) => {
        measurementGraphModel.timeSeries.push(timeSeries);
        return measurementGraphModel;
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

  private _subscribeToSimulationOutputMeasurementsStream(): Subscription {
    return this._simulationOutputService.simulationOutputMeasurementsReceived()
      .subscribe(measurements => {
        const measurementGraphModels = Object.entries(GRAPH_NAMES_PER_SIMULATION_NAME[this.props.simulationName] as { [key: string]: string[] })
          .map(([graphName, timeSeriesNames]) => this._buildPlotModel(graphName, timeSeriesNames, measurements));
        this.setState({ measurementGraphModels });
      });
  }
}