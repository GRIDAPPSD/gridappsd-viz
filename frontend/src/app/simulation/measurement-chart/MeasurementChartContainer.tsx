import * as React from 'react';
import { Subscription, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { MeasurementChart } from './MeasurementChart';
import { MeasurementChartModel } from './models/MeasurementChartModel';
import { SimulationOutputMeasurement, SimulationControlService } from '@shared/simulation';
import { SimulationStatus } from '@commons/SimulationStatus';
import { TimeSeries } from './models/TimeSeries';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { StateStore } from '@shared/state-store';
import { MeasurementType } from '@shared/topology';
import { PlotModel, PlotModelComponent } from '@shared/plot-model';

interface Props {
}

interface State {
  measurementChartModels: MeasurementChartModel[];
}

export class MeasurementChartContainer extends React.Component<Props, State> {

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
    this._pickMeasurementChartModelsFromSimulationSnapshotStream();
    this._subscribeToPlotModelsStateStore();
    this._subscribeToSimulationOutputMeasurementsStream();
    this._resetMeasurementChartModelsWhenSimulationStarts();
  }

  private _pickMeasurementChartModelsFromSimulationSnapshotStream() {
    this._simulationControlService.selectSimulationSnapshotState('measurementChartModels')
      .pipe(
        takeUntil(this._unsubscriber),
        filter(this._simulationControlService.isUserInActiveSimulation)
      )
      .subscribe({
        next: (measurementChartModels: MeasurementChartModel[]) => {
          // After serialization, date values were converted to string
          for (const model of measurementChartModels) {
            for (const series of model.timeSeries) {
              for (const point of series.points) {
                point.timestamp = new Date(point.timestamp);
              }
            }
          }
          this.setState({
            measurementChartModels
          });
        }
      });
  }

  private _subscribeToPlotModelsStateStore() {
    this._stateStore.select('plotModels')
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: plotModels => {
          this._plotModels = plotModels;
          this._updateMeasurementChartModels();
        }
      });
  }

  private _updateMeasurementChartModels(resetAllTimeSeries = false) {
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
    if (this._simulationControlService.didUserStartActiveSimulation()) {
      this._simulationControlService.syncSimulationSnapshotState({
        measurementChartModels
      });
    }
  }

  private _createDefaultMeasurementChartModel(plotModel: PlotModel): MeasurementChartModel {
    return {
      name: plotModel.name,
      timeSeries: [],
      yAxisLabel: this._deriveYAxisLabel(plotModel)
    };
  }

  private _deriveYAxisLabel(plotModel: PlotModel) {
    switch (plotModel.measurementType) {
      case MeasurementType.POWER:
        return 'W';
      case MeasurementType.VOLTAGE:
        return 'V';
      case MeasurementType.TAP:
        return '';
      default:
        return '';
    }
  }

  private _findOrCreateTimeSeries(plotModel: PlotModel, component: PlotModelComponent): TimeSeries {
    const timeSeriesName = component.displayName;
    const timeSeriesId = `${plotModel.name}_${timeSeriesName}`;
    if (!this._timeSeries.has(timeSeriesId)) {
      this._timeSeries.set(timeSeriesId, { name: timeSeriesName, points: [] });
    }
    return this._timeSeries.get(timeSeriesId);
  }

  private _subscribeToSimulationOutputMeasurementsStream(): Subscription {
    return this._simulationControlService.simulationOutputMeasurementsReceived()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(() => this._plotModels.length > 0 && this._simulationControlService.didUserStartActiveSimulation())
      )
      .subscribe({
        next: measurements => {
          const measurementChartModels = this._plotModels
            .map(plotModel => this._buildMeasurementChartModel(plotModel, measurements));
          this.setState({
            measurementChartModels
          });
          if (this._simulationControlService.didUserStartActiveSimulation()) {
            this._simulationControlService.syncSimulationSnapshotState({
              measurementChartModels
            });
          }
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
      if (timeSeries.points.length === 20) {
        timeSeries.points.shift();
      }
      timeSeries.points.push(nextTimeStepDataPoint);
    }
    return timeSeries;
  }

  private _getDataPointForTimeSeries(
    plotModel: PlotModel,
    component: PlotModelComponent,
    measurements: Map<string, SimulationOutputMeasurement>
  ): TimeSeriesDataPoint {
    const measurement = measurements.get(component.id);
    if (measurement !== undefined) {
      const dataPoint: TimeSeriesDataPoint = {
        timestamp: new Date(this._simulationControlService.getOutputTimestamp() * 1000),
        measurement: 0
      };
      switch (plotModel.measurementType) {
        case MeasurementType.VOLTAGE:
        case MeasurementType.POWER:
          const valueType = plotModel.useMagnitude ? 'magnitude' : 'angle';
          dataPoint.measurement = measurement[valueType];
          return dataPoint;
        case MeasurementType.TAP:
          dataPoint.measurement = measurement.value;
          return dataPoint;
      }
    } else {
      console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
    }
    return null;
  }


  private _resetMeasurementChartModelsWhenSimulationStarts() {
    this._simulationControlService.statusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status === SimulationStatus.STARTING && this._simulationControlService.didUserStartActiveSimulation())
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
