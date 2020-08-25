import * as React from 'react';
import { Subscription, Subject } from 'rxjs';
import { filter, takeUntil, map } from 'rxjs/operators';

import { MeasurementChart } from './MeasurementChart';
import { MeasurementChartModel } from './models/MeasurementChartModel';
import { SimulationOutputMeasurement, SimulationManagementService } from '@shared/simulation';
import { SimulationStatus } from '@common/SimulationStatus';
import { TimeSeries } from './models/TimeSeries';
import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { StateStore } from '@shared/state-store';
import { MeasurementType } from '@shared/topology';
import { PlotModel, PlotModelComponent } from '@shared/plot-model';
import { Limits } from './models/Limits';
import { StompClientService } from '@shared/StompClientService';
import { FetchLimitsFileRequest } from './models/FetchLimitsFileRequest';

interface Props {
}

interface State {
  measurementChartModels: MeasurementChartModel[];
}

export class MeasurementChartContainer extends React.Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _simulationManagementService = SimulationManagementService.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _timeSeries = new Map<string, TimeSeries>();
  private readonly _unsubscriber = new Subject<void>();
  private readonly _nominalVoltageDivisorMap = new Map<string, number>();

  private _plotModels: PlotModel[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      measurementChartModels: []
    };
  }

  componentDidMount() {
    this._pickMeasurementChartModelsFromSimulationSnapshotStream();
    this._subscribeToPlotModelsStateStore();
    this._subscribeToSimulationOutputMeasurementMapStream();
    this._resetMeasurementChartModelsWhenSimulationStarts();
    this._fetchLimitsFileWhenSimulationIdChanges();
  }

  private _pickMeasurementChartModelsFromSimulationSnapshotStream() {
    this._simulationManagementService.selectSimulationSnapshotState('measurementChartModels')
      .pipe(
        takeUntil(this._unsubscriber),
        filter(this._simulationManagementService.isUserInActiveSimulation)
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
          this._plotModels = [
            this._createPlotModelForMinAverageMaxChart(),
            ...plotModels
          ];
          this._updateMeasurementChartModels();
        }
      });
  }

  private _createPlotModelForMinAverageMaxChart(): PlotModel {
    return {
      name: 'Min/Average/Max Voltages',
      measurementType: MeasurementType.VOLTAGE,
      components: [
        {
          id: 'min',
          phase: '',
          displayName: 'Min'
        },
        {
          id: 'average',
          phase: '',
          displayName: 'Average'
        },
        {
          id: 'max',
          phase: '',
          displayName: 'Max'
        }
      ],
      useMagnitude: true,
      useAngle: false
    };
  }

  private _updateMeasurementChartModels(resetAllTimeSeries = false) {
    const measurementChartModels: MeasurementChartModel[] = [];
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
    if (this._simulationManagementService.didUserStartActiveSimulation()) {
      this._simulationManagementService.syncSimulationSnapshotState({
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

  private _subscribeToSimulationOutputMeasurementMapStream(): Subscription {
    return this._simulationManagementService.simulationOutputMeasurementMapReceived()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(() => this._simulationManagementService.didUserStartActiveSimulation())
      )
      .subscribe({
        next: measurements => {
          const measurementChartModels: MeasurementChartModel[] = [
            this._buildMinAverageMaxVoltageMeasurementChartModel(measurements)
          ];

          // Skip the first element because it is the Min/Average/Max PlotModel
          for (let i = 1; i < this._plotModels.length; i++) {
            measurementChartModels.push(this._buildMeasurementChartModel(this._plotModels[i], measurements));
          }
          this.setState({
            measurementChartModels
          });
          if (this._simulationManagementService.didUserStartActiveSimulation()) {
            this._simulationManagementService.syncSimulationSnapshotState({
              measurementChartModels
            });
          }
        }
      });
  }

  private _buildMinAverageMaxVoltageMeasurementChartModel(measurements: Map<string, SimulationOutputMeasurement>): MeasurementChartModel {
    let minVoltage = Infinity;
    let maxVoltage = -Infinity;
    let averageVoltage = Infinity;
    const plotModel = this._plotModels[0];
    const measurementChartModel = this._createDefaultMeasurementChartModel(plotModel);

    if (measurements) {
      let totalVoltage = 0;
      let numberOfVoltageMeasurements = 0;
      measurements.forEach(measurement => {
        if (measurement.type === MeasurementType.VOLTAGE) {
          const nominalVoltage = measurement.magnitude / this._nominalVoltageDivisorMap.get(measurement.connectivityNode);
          if (nominalVoltage < minVoltage) {
            minVoltage = nominalVoltage;
          }
          if (nominalVoltage > maxVoltage) {
            maxVoltage = nominalVoltage;
          }
          totalVoltage += nominalVoltage;
          numberOfVoltageMeasurements++;
        }
      });
      averageVoltage = totalVoltage / numberOfVoltageMeasurements;
    }
    measurementChartModel.timeSeries[0] = this._updateMinAverageMaxTimeSeriesLine(this._findOrCreateTimeSeries(plotModel, plotModel.components[0]), minVoltage);
    measurementChartModel.timeSeries[1] = this._updateMinAverageMaxTimeSeriesLine(this._findOrCreateTimeSeries(plotModel, plotModel.components[1]), averageVoltage);
    measurementChartModel.timeSeries[2] = this._updateMinAverageMaxTimeSeriesLine(this._findOrCreateTimeSeries(plotModel, plotModel.components[2]), maxVoltage);
    return measurementChartModel;
  }

  private _updateMinAverageMaxTimeSeriesLine(timeSeries: TimeSeries, value: number) {
    if (timeSeries.points.length === 20) {
      timeSeries.points.pop();
    }
    if (value !== Infinity && value !== -Infinity) {
      timeSeries.points.push({
        timestamp: new Date(this._simulationManagementService.getOutputTimestamp() * 1000),
        measurement: value
      });
    }
    return timeSeries;
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
        timestamp: new Date(this._simulationManagementService.getOutputTimestamp() * 1000),
        measurement: 0
      };
      switch (plotModel.measurementType) {
        case MeasurementType.VOLTAGE:
        case MeasurementType.POWER:
          dataPoint.measurement = measurement[plotModel.useMagnitude ? 'magnitude' : 'angle'];
          return dataPoint;
        case MeasurementType.TAP:
          dataPoint.measurement = measurement.value;
          return dataPoint;
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
    }
    return null;
  }


  private _resetMeasurementChartModelsWhenSimulationStarts() {
    this._simulationManagementService.simulationStatusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status === SimulationStatus.STARTING && this._simulationManagementService.didUserStartActiveSimulation())
      )
      .subscribe({
        next: () => this._updateMeasurementChartModels(true)
      });
  }

  private _fetchLimitsFileWhenSimulationIdChanges() {
    this._stateStore.select('simulationId')
      .pipe(
        takeUntil(this._unsubscriber),
        filter(simulationId => simulationId !== ''),
        map(simulationId => new FetchLimitsFileRequest(simulationId))
      )
      .subscribe({
        next: request => {
          this._stompClientService.readOnceFrom<{ limits: Limits }>(request.replyTo)
            .subscribe({
              next: payload => {
                for (const limit of payload.limits.voltages) {
                  /*
                    Get the percentage of nominal voltage for each ConnectivityNode
                    by taking the average of Alo and Blo, then divide each measured
                    voltage value by this average, then find the min/average/max
                    voltages after applying the divisions.
                  */
                  this._nominalVoltageDivisorMap.set(limit.ConnectivityNode, (limit.Alo + limit.Blo) / 2);
                }
              }
            });
          this._stompClientService.send({
            destination: request.url,
            body: JSON.stringify(request.requestBody),
            replyTo: request.replyTo
          });
        }
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
