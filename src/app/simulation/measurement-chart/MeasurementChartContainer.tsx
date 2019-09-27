import * as React from 'react';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { MeasurementChart } from './MeasurementChart';
import { MeasurementChartModel } from './models/MeasurementChartModel';
import { SimulationOutputMeasurement, SimulationOutputService } from '@shared/simulation';
import { TimeSeries } from './models/TimeSeries';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { StateStore } from '@shared/state-store';
import { ModelDictionaryComponentType } from '@shared/topology';
import { PlotModel, PlotModelComponent } from '@shared/plot-model';

interface Props {
}

interface State {
  measurementChartModels: MeasurementChartModel[];
}

export class MeasurementChartContainer extends React.Component<Props, State> {

  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _timeSeries = new Map<string, TimeSeries>();

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
      .pipe(filter(() => this._plotModels !== undefined && this._plotModels.length > 0))
      .subscribe(measurements => {
        const measurementChartModels = this._plotModels
          .map(plotModel => this._buildMeasurementChartModel(plotModel, measurements));
        this.setState({ measurementChartModels });
      });
  }

  private _buildMeasurementChartModel(plotModel: PlotModel, measurements: Map<string, SimulationOutputMeasurement>): MeasurementChartModel {
    return plotModel.components.map(component => this._buildTimeSeries(plotModel, component, measurements))
      .reduce((measurementChartModel: MeasurementChartModel, timeSeries: TimeSeries) => {
        measurementChartModel.timeSeries.push(timeSeries);
        return measurementChartModel;
      }, this._createDefaultMeasurementChartModel(plotModel));
  }

  private _buildTimeSeries(
    plotModel: PlotModel,
    component: PlotModelComponent,
    measurements: Map<string, SimulationOutputMeasurement>
  ): TimeSeries {
    const timeSeriesName = component.displayName;
    const timeSeriesId = `${plotModel.name}_${timeSeriesName}`;
    const timeSeries: TimeSeries = this._timeSeries.get(timeSeriesId) || { name: timeSeriesName, points: [] };
    if (timeSeries.points.length === 20)
      timeSeries.points.shift();
    timeSeries.points.push(this._getDataPointForTimeSeries(plotModel, component, measurements));
    this._timeSeries.set(timeSeriesId, timeSeries);
    return timeSeries;
  }

  private _getDataPointForTimeSeries(
    plotModel: PlotModel,
    component: PlotModelComponent,
    measurements: Map<string, SimulationOutputMeasurement>
  ): TimeSeriesDataPoint {
    const dataPoint = {
      primitiveX: new Date(),
      primitiveY: 0
    };
    const valueType = plotModel.useMagnitude ? 'magnitude' : 'angle';
    switch (plotModel.componentType) {
      case ModelDictionaryComponentType.VOLTAGE:
        const voltageMeasurement = measurements.get(component.id);
        if (voltageMeasurement !== undefined)
          dataPoint.primitiveY = voltageMeasurement[valueType];
        else
          console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
        break;
      case ModelDictionaryComponentType.POWER:
        const powerMeasurement = measurements.get(component.id);
        if (powerMeasurement !== undefined)
          dataPoint.primitiveY = powerMeasurement[valueType];
        else
          console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
        break;
      case ModelDictionaryComponentType.TAP:
        const tapMeasurement = measurements.get(component.id);
        if (tapMeasurement !== undefined)
          dataPoint.primitiveY = tapMeasurement.value;
        else
          console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
        break;
    }
    return dataPoint;
  }

  private _createDefaultMeasurementChartModel(plotModel: PlotModel): MeasurementChartModel {
    return {
      name: plotModel.name,
      timeSeries: [],
      yAxisLabel: plotModel.useAngle ? 'Angle' : plotModel.useMagnitude ? 'Magnitude' : 'Value'
    };
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
