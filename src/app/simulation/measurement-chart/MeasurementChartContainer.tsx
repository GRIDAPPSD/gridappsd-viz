import * as React from 'react';
import { Subscription, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { MeasurementChart } from './MeasurementChart';
import { MeasurementChartModel } from './models/MeasurementChartModel';
import { SimulationOutputMeasurement, SimulationOutputService, SimulationControlService, SimulationStatus } from '@shared/simulation';
import { TimeSeries } from './models/TimeSeries';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { StateStore } from '@shared/state-store';
import { ModelDictionaryComponentType } from '@shared/topology';
import { PlotModel, PlotModelComponent } from '@shared/plot-model';
import { download, DownloadType } from '@shared/misc';

interface Props {
}

interface State {
  measurementChartModels: MeasurementChartModel[];
}

let plots = null;

export class MeasurementChartContainer extends React.Component<Props, State> {

  private readonly _simulationOutputService = SimulationOutputService.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private readonly _timeSeries = new Map<string, TimeSeries>();
  private readonly _unsubscriber = new Subject<void>();

  private _plotModels: PlotModel[] = [];

  constructor(props: any) {
    super(props);
    this.state = {
      measurementChartModels: []
    };
  }

  componentDidMount() {
    this._subscribeToPlotModelsStateStore();
    this._subscribeToSimulationOutputMeasurementsStream();
    this._resetMeasurementChartModelsWhenSimulationStarts();

    this._simulationControlService.statusChanges()
      .subscribe({
        next: status => {
          if (status === SimulationStatus.STARTED) {
            plots = {};
            for (const plotModel of this._plotModels) {
              plots[plotModel.name] = {};
              for (const component of plotModel.components)
                plots[plotModel.name][component.displayName] = [];
            }
          } else if (status === SimulationStatus.STOPPED && plots !== null) {
            download('plots.json', JSON.stringify(plots, null, 4), DownloadType.JSON);
            plots = null;
          }
        }
      });
  }

  private _subscribeToPlotModelsStateStore(): Subscription {
    return this._stateStore.select('plotModels')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: plotModels => {
          this._plotModels = plotModels;
          this._updateMeasurementChartModels();
        }
      });
  }

  private _updateMeasurementChartModels(resetAllTimeSeries = false) {
    if (this._plotModels.length > 0) {
      const measurementChartModels = [];
      for (let i = 0; i < this._plotModels.length; i++) {
        const plotModel = this._plotModels[i];
        const measurementChartModel = this._createDefaultMeasurementChartModel(plotModel);
        const templateMeasurementChartModel = this.state.measurementChartModels[i];
        if (templateMeasurementChartModel) {
          if (resetAllTimeSeries) {
            for (const series of templateMeasurementChartModel.timeSeries) {
              series.points = [];
            }
          }
          measurementChartModel.yAxisLabel = templateMeasurementChartModel.yAxisLabel;
        }
        measurementChartModel.timeSeries = plotModel.components.map(
          component => this._findOrCreateTimeSeries(plotModel, component)
        );
        measurementChartModels.push(measurementChartModel);
      }
      this.setState({
        measurementChartModels
      });
    }
  }

  private _subscribeToSimulationOutputMeasurementsStream(): Subscription {
    return this._simulationOutputService.simulationOutputMeasurementsReceived()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(() => this._plotModels.length > 0)
      )
      .subscribe({
        next: measurements => {
          const measurementChartModels = this._plotModels
            .map(plotModel => this._buildMeasurementChartModel(plotModel, measurements));
          this.setState({ measurementChartModels });
        }
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
    const timeSeries = this._findOrCreateTimeSeries(plotModel, component);
    const nextTimeStepDataPoint = this._getDataPointForTimeSeries(plotModel, component, measurements);

    if (nextTimeStepDataPoint) {
      if (timeSeries.points.length === 20)
        timeSeries.points.shift();
      timeSeries.points.push(nextTimeStepDataPoint);
    }
    return timeSeries;
  }

  private _findOrCreateTimeSeries(plotModel: PlotModel, component: PlotModelComponent): TimeSeries {
    const timeSeriesName = component.displayName;
    const timeSeriesId = `${plotModel.name}_${timeSeriesName}`;
    if (!this._timeSeries.has(timeSeriesId))
      this._timeSeries.set(timeSeriesId, { name: timeSeriesName, points: [] });
    return this._timeSeries.get(timeSeriesId);
  }

  private _getDataPointForTimeSeries(
    plotModel: PlotModel,
    component: PlotModelComponent,
    measurements: Map<string, SimulationOutputMeasurement>
  ): TimeSeriesDataPoint {
    const measurement = measurements.get(component.id);
    if (measurement !== undefined) {
      const dataPoint: TimeSeriesDataPoint = {
        unscaledX: new Date(this._simulationOutputService.getOutputTimestamp() * 1000),
        unscaledY: 0
      };
      if (plots) {
        plots[plotModel.name][component.displayName].push(measurement);
      }

      switch (plotModel.componentType) {
        case ModelDictionaryComponentType.VOLTAGE:
        case ModelDictionaryComponentType.POWER:
          const valueType = plotModel.useMagnitude ? 'magnitude' : 'angle';
          dataPoint.unscaledY = measurement[valueType];
          return dataPoint;
        case ModelDictionaryComponentType.TAP:
          dataPoint.unscaledY = measurement.value;
          return dataPoint;
      }
    } else {
      console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
    }
    return null;
  }

  private _createDefaultMeasurementChartModel(plotModel: PlotModel): MeasurementChartModel {
    return {
      name: plotModel.name,
      timeSeries: [],
      yAxisLabel: plotModel.useAngle ? 'Angle' : plotModel.useMagnitude ? 'Magnitude' : 'Value'
    };
  }

  private _resetMeasurementChartModelsWhenSimulationStarts() {
    this._simulationControlService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status === SimulationStatus.STARTED)
      )
      .subscribe({
        next: () => this._updateMeasurementChartModels(true)
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      this.state.measurementChartModels.map(
        measurementChartModel => <MeasurementChart key={measurementChartModel.name} measurementChartModel={measurementChartModel} />
      )
    );
  }

}
