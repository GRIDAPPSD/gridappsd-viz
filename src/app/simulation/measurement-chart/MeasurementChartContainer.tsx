import * as React from 'react';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { MeasurementChart } from './MeasurementChart';
import { MeasurementChartModel } from './models/MeasurementChartModel';
import { SimulationOutputMeasurement, SimulationOutputService, SimulationQueue } from '@shared/simulation';
import { TimeSeries } from './models/TimeSeries';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { StateStore } from '@shared/state-store';
import { PlotModel, PlotModelComponent, PlotModelComponentType } from '@shared/plot-model';

interface Props {
}

interface State {
  measurementChartModels: MeasurementChartModel[];
}

export class MeasurementChartContainer extends React.Component<Props, State> {

  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _stateStore = StateStore.getInstance();

  private _timeSeries: { [seriesName: string]: TimeSeries } = {};
  private _simulationOutputMeasurementsStream: Subscription;
  private _plotModels: PlotModel[];
  private _plotModelsStateSubscription: Subscription;

  constructor(props: any) {
    super(props);
    this.state = {
      measurementChartModels: []
    };
  }

  componentDidMount() {
    this._plotModelsStateSubscription = this._subscribeToPlotModelsStateStore();
    this._simulationOutputMeasurementsStream = this._subscribeToSimulationOutputMeasurementsStream();
  }

  private _subscribeToPlotModelsStateStore(): Subscription {
    return this._stateStore.select('plotModels')
      .subscribe({
        next: plotModels => this._plotModels = plotModels
      });
  }

  private _subscribeToSimulationOutputMeasurementsStream(): Subscription {
    return this._simulationOutputService.simulationOutputMeasurementsReceived()
      .pipe(filter(() => this._plotModels !== undefined))
      .subscribe(measurements => {
        const measurementChartModels = this._plotModels
          .map(plotModel => this._buildMeasurementChartModel(plotModel, measurements));
        this.setState({ measurementChartModels });
      });
  }

  private _buildMeasurementChartModel(plotModel: PlotModel, measurements: SimulationOutputMeasurement[]): MeasurementChartModel {
    return plotModel.components.map(component => this._buildTimeSeries(plotModel, component, measurements))
      .reduce((measurementChartModel: MeasurementChartModel, timeSeries: TimeSeries) => {
        measurementChartModel.timeSeries.push(timeSeries);
        return measurementChartModel;
      }, { name: plotModel.name, timeSeries: [] });
  }

  private _buildTimeSeries(plotModel: PlotModel, component: PlotModelComponent, measurements: SimulationOutputMeasurement[]): TimeSeries {
    const timeSeriesName = `${component.id} (${component.phases})`;
    const timeSeriesId = `${plotModel.name}_${timeSeriesName}`;
    const timeSeries: TimeSeries = this._timeSeries[timeSeriesId] || { name: timeSeriesName, points: [] };
    if (timeSeries.points.length === 20)
      timeSeries.points.shift();
    timeSeries.points.push(this._getDataPointForTimeSeries(plotModel, component, measurements));
    this._timeSeries[timeSeriesId] = timeSeries;
    return timeSeries;
  }

  private _getDataPointForTimeSeries(
    plotModel: PlotModel,
    component: PlotModelComponent,
    measurements: SimulationOutputMeasurement[]
  ): TimeSeriesDataPoint {
    const dataPoint = {
      primitiveX: new Date(),
      primitiveY: 0
    };
    switch (plotModel.componentType) {
      case PlotModelComponentType.VOLTAGE:
        const voltageMeasurement = measurements.find(
          measurement => measurement.connectivityNode === component.id
            && component.phases.includes(measurement.phases)
            && measurement.type === PlotModelComponentType.VOLTAGE
            && measurement.magnitude !== undefined
        );
        if (voltageMeasurement !== undefined)
          dataPoint.primitiveY = voltageMeasurement.magnitude;
        else
          console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
        break;
      case PlotModelComponentType.POWER:
        const powerMeasurement = measurements.find(
          measurement => measurement.conductingEquipmentName === component.id
            && component.phases.includes(measurement.phases)
            && measurement.type === PlotModelComponentType.POWER
            && measurement.magnitude !== undefined
        );
        if (powerMeasurement !== undefined)
          dataPoint.primitiveY = powerMeasurement.magnitude;
        else
          console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
        break;
      case PlotModelComponentType.TAP:
        const tapMeasurement = measurements.find(
          measurement => measurement.conductingEquipmentName === component.id
            && component.phases.includes(measurement.phases)
            && measurement.type === PlotModelComponentType.TAP
            && measurement.value !== undefined
        );
        if (tapMeasurement !== undefined)
          dataPoint.primitiveY = tapMeasurement.value;
        else
          console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
        break;
    }
    return dataPoint;
  }

  componentWillUnmount() {
    this._simulationOutputMeasurementsStream.unsubscribe();
    this._plotModelsStateSubscription.unsubscribe();
  }

  render() {
    return (
      this.state.measurementChartModels.map(
        measurementChartModel => <MeasurementChart key={measurementChartModel.name} measurementChartModel={measurementChartModel} />
      )
    );
  }

}