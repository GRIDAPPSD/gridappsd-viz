import { Component } from 'react';
import { Subscription, Subject } from 'rxjs';
import { filter, takeUntil, map } from 'rxjs/operators';

import { StateStore } from '@client:common/state-store';
import { SimulationOutputMeasurement, SimulationManagementService } from '@client:common/simulation';
import { MeasurementType, ConductingEquipmentType } from '@client:common/topology';
import { StompClientService } from '@client:common/StompClientService';
import { PlotModel, PlotModelComponent } from '@client:common/plot-model';
import { SimulationStatus } from '@project:common/SimulationStatus';
import { SimulationQueue } from '@client:common/simulation';

import { TimeSeriesDataPoint } from './models/TimeSeriesDataPoint';
import { TimeSeries } from './models/TimeSeries';
import { RenderableChartModel } from './models/RenderableChartModel';
import { MeasurementChart } from './MeasurementChart';
import { FetchLimitsFileRequest, FetchLimitsFileRequestPayload } from './models/FetchLimitsFileRequest';

interface Props {
}

interface State {
  renderableChartModels: RenderableChartModel[];
}

/**
 * The smart component for the plots shown on the right say during a simulation
 */
export class MeasurementChartContainer extends Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _simulationManagementService = SimulationManagementService.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _timeSeries = new Map<string, TimeSeries>();
  private readonly _unsubscriber = new Subject<void>();
  private readonly _nominalVoltageDivisorMap = new Map<string, number>();
  private readonly _simulationQueue = SimulationQueue.getInstance();

  private _plotModels: PlotModel[] = [];
  private _activeSimulationStream: Subscription = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      renderableChartModels: []
    };
  }

  componentDidMount() {
    this._observeActiveSimulationChangeEvent();
    this._pickRenderableChartModelsFromSimulationSnapshotStream();
    this._subscribeToPlotModelsStateStore();
    this._subscribeToSimulationOutputMeasurementMapStream();
    this._fetchLimitsFileWhenSimulationIdChanges();
    this._resetRenderableChartModelsWhenSimulationStarts();
  }

  private _observeActiveSimulationChangeEvent() {
    this._activeSimulationStream = this._simulationQueue.queueChanges()
      .subscribe({
        next: () => {
          this._resetChartToDefault();
        }
      });
  }

  private _resetChartToDefault() {
    const finalChartModels: RenderableChartModel[] = [];
    for (let i = 0; i < this._plotModels.length; i++) {
      const plotModel = this._plotModels[i];
      const renderableChartModel = this._createDefaultRenderableChartModel(plotModel);
      const templateRenderableChartModel = this.state.renderableChartModels[i];
      if (templateRenderableChartModel) {
        for (const series of templateRenderableChartModel.timeSeries) {
          series.points = [];
        }
        renderableChartModel.yAxisLabel = this.state.renderableChartModels[i].yAxisLabel;
      }
      renderableChartModel.timeSeries = plotModel.components.map(e => this._findOrCreateTimeSeries(plotModel, e));
      finalChartModels.push(renderableChartModel);
    }
    if (finalChartModels[1].yAxisLabel === '') {
      finalChartModels[1].yAxisLabel = 'kVA';
    }
    this.setState({
      renderableChartModels: finalChartModels
    });
  }

  private _pickRenderableChartModelsFromSimulationSnapshotStream() {
    this._simulationManagementService.selectSimulationSnapshotState('renderableChartModels')
      .pipe(
        takeUntil(this._unsubscriber),
        filter(this._simulationManagementService.isUserInActiveSimulation)
      )
      .subscribe({
        next: (renderableChartModels: RenderableChartModel[]) => {
          // After serialization, date values were converted to string
          for (const model of renderableChartModels) {
            for (const series of model.timeSeries) {
              for (const point of series.points) {
                point.timestamp = new Date(point.timestamp);
              }
            }
          }
          this.setState({
            renderableChartModels
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
            this._createPlotModelForLoadDemandChart(),
            ...plotModels
          ];
          this._updateRenderableChartModels();
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

  private _createPlotModelForLoadDemandChart(): PlotModel {
    return {
      name: 'Load Demand',
      measurementType: MeasurementType.NONE,
      components: [
        {
          id: 'energyConsumerP',
          phase: '',
          displayName: 'EnergyConsumer p'
        },
        {
          id: 'energyConsumerQ',
          phase: '',
          displayName: 'EnergyConsumer q'
        },
        {
          id: 'batteryP',
          phase: '',
          displayName: 'Battery p'
        },
        {
          id: 'batteryQ',
          phase: '',
          displayName: 'Battery q'
        },
        {
          id: 'solarP',
          phase: '',
          displayName: 'Solar p'
        },
        {
          id: 'solarQ',
          phase: '',
          displayName: 'Solar q'
        }
      ],
      useMagnitude: false,
      useAngle: false
    };
  }

  private _updateRenderableChartModels(resetAllTimeSeries = false) {
    const renderableChartModels: RenderableChartModel[] = [];
    for (let i = 0; i < this._plotModels.length; i++) {
      const plotModel = this._plotModels[i];
      const renderableChartModel = this._createDefaultRenderableChartModel(plotModel);
      if (resetAllTimeSeries) {
        const templateRenderableChartModel = this.state.renderableChartModels[i];
        if (templateRenderableChartModel) {
          for (const series of templateRenderableChartModel.timeSeries) {
            series.points = [];
          }
          renderableChartModel.yAxisLabel = templateRenderableChartModel.yAxisLabel;
        }
      }
      renderableChartModel.timeSeries = plotModel.components.map(e => this._findOrCreateTimeSeries(plotModel, e));
      renderableChartModels.push(renderableChartModel);
    }
    // If Load Demand chart has no Y-axis label
    // we want to set it now
    if (renderableChartModels[1].yAxisLabel === '') {
      renderableChartModels[1].yAxisLabel = 'kVA';
    }
    this.setState({
      renderableChartModels
    });
    if (this._simulationManagementService.didUserStartActiveSimulation()) {
      this._simulationManagementService.syncSimulationSnapshotState({
        renderableChartModels
      });
    }
  }

  private _createDefaultRenderableChartModel(plotModel: PlotModel): RenderableChartModel {
    return {
      name: plotModel.name,
      timeSeries: [],
      yAxisLabel: this._deriveYAxisLabel(plotModel)
    };
  }

  private _deriveYAxisLabel(plotModel: PlotModel) {
    switch (plotModel.measurementType) {
      case MeasurementType.POWER:
        if (plotModel.useMagnitude) {
          return 'kVA';
        } else {
          return 'Degrees';
        }
      case MeasurementType.VOLTAGE:
        if (plotModel.useMagnitude) {
          return 'V';
        } else {
          return 'Degrees';
        }
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
        next: measurementMap => {
          const renderableChartModels = this._createDefaultCharts(measurementMap);

          // Skip the first 2 elements because they are the Min/Average/Max and Load Demand PlotModels
          for (let i = 2; i < this._plotModels.length; i++) {
            renderableChartModels.push(this._createRenderableChartModel(this._plotModels[i], measurementMap));
          }
          this.setState({
            renderableChartModels
          });
          if (this._simulationManagementService.didUserStartActiveSimulation()) {
            this._simulationManagementService.syncSimulationSnapshotState({
              renderableChartModels
            });
          }
        }
      });
  }

  private _createDefaultCharts(measurements: Map<string, SimulationOutputMeasurement>) {
    let minVoltage = Infinity;
    let maxVoltage = -Infinity;
    let averageVoltage = Infinity;
    let energyConsumerP = 0;
    let energyConsumerQ = 0;
    let batteryP = 0;
    let batteryQ = 0;
    let solarP = 0;
    let solarQ = 0;


    if (measurements) {
      let totalVoltage = 0;
      let numberOfVoltageMeasurements = 0;
      measurements.forEach(measurement => {
        if (measurement.type === MeasurementType.VOLTAGE) {
          const nominalVoltage = this._nominalVoltageDivisorMap.get(measurement.connectivityNode);
          if (nominalVoltage) {
            const percentOfNominalVoltage = measurement.magnitude / nominalVoltage;
            if (percentOfNominalVoltage < minVoltage) {
              minVoltage = percentOfNominalVoltage;
            }
            if (percentOfNominalVoltage > maxVoltage) {
              maxVoltage = percentOfNominalVoltage;
            }
            totalVoltage += percentOfNominalVoltage;
            numberOfVoltageMeasurements++;
          }
        }
        if (measurement.conductingEquipmentType === ConductingEquipmentType.EnergyConsumer) {
          const [p, q] = this._calculatePQValues(measurement);
          energyConsumerP += p;
          energyConsumerQ += q;
        } else if (measurement.name.startsWith('PowerElectronicsConnection_BatteryUnit')) {
          const [p, q] = this._calculatePQValues(measurement);
          batteryP += p;
          batteryQ += q;
        } else if (measurement.name.startsWith('PowerElectronicsConnection_PhotovoltaicUnit')) {
          const [p, q] = this._calculatePQValues(measurement);
          solarP += p;
          solarQ += q;
        }
      });
      averageVoltage = totalVoltage / numberOfVoltageMeasurements;
    }
    const minAverageMaxPlotModel = this._plotModels[0];
    const minAverageMaxRenderableChartModel = this._createDefaultRenderableChartModel(minAverageMaxPlotModel);
    minAverageMaxRenderableChartModel.timeSeries = [
      this._addValueToTimeSeries(this._findOrCreateTimeSeries(minAverageMaxPlotModel, minAverageMaxPlotModel.components[0]), minVoltage),
      this._addValueToTimeSeries(this._findOrCreateTimeSeries(minAverageMaxPlotModel, minAverageMaxPlotModel.components[1]), averageVoltage),
      this._addValueToTimeSeries(this._findOrCreateTimeSeries(minAverageMaxPlotModel, minAverageMaxPlotModel.components[2]), maxVoltage)
    ];

    const loadDemandPlotModel = this._plotModels[1];
    const loadDemandRenderableChartModel = this._createDefaultRenderableChartModel(loadDemandPlotModel);
    loadDemandRenderableChartModel.yAxisLabel = 'kVA';
    loadDemandRenderableChartModel.timeSeries = [
      this._addValueToTimeSeries(this._findOrCreateTimeSeries(loadDemandPlotModel, loadDemandPlotModel.components[0]), energyConsumerP / 1000),
      this._addValueToTimeSeries(this._findOrCreateTimeSeries(loadDemandPlotModel, loadDemandPlotModel.components[1]), energyConsumerQ / 1000),
      this._addValueToTimeSeries(this._findOrCreateTimeSeries(loadDemandPlotModel, loadDemandPlotModel.components[2]), batteryP / 1000),
      this._addValueToTimeSeries(this._findOrCreateTimeSeries(loadDemandPlotModel, loadDemandPlotModel.components[3]), batteryQ / 1000),
      this._addValueToTimeSeries(this._findOrCreateTimeSeries(loadDemandPlotModel, loadDemandPlotModel.components[4]), solarP / 1000),
      this._addValueToTimeSeries(this._findOrCreateTimeSeries(loadDemandPlotModel, loadDemandPlotModel.components[5]), solarQ / 1000)
    ];

    return [
      minAverageMaxRenderableChartModel,
      loadDemandRenderableChartModel
    ];
  }

  private _calculatePQValues(measurement: SimulationOutputMeasurement): [p: number, q: number] {
    if (Number.isFinite(measurement.magnitude) && Number.isFinite(measurement.angle)) {
      const angleInRadian = measurement.angle * Math.PI / 180;
      return [
        measurement.magnitude * Math.cos(angleInRadian),
        measurement.magnitude * Math.sin(angleInRadian)
      ];
    }
    return [0, 0];
  }

  private _addValueToTimeSeries(timeSeries: TimeSeries, value: number) {
    if (Number.isFinite(value)) {
      if (timeSeries.points.length === 20) {
        timeSeries.points.shift();
      }
      timeSeries.points.push({
        timestamp: new Date(this._simulationManagementService.getOutputTimestamp() * 1000),
        measurement: value
      } as TimeSeriesDataPoint);
    }
    return timeSeries;
  }

  private _createRenderableChartModel(plotModel: PlotModel, measurements: Map<string, SimulationOutputMeasurement>): RenderableChartModel {
    return plotModel.components.map(component => this._createTimeSeries(plotModel, component, measurements.get(component.id)))
      .reduce((renderableChartModel: RenderableChartModel, timeSeries: TimeSeries) => {
        renderableChartModel.timeSeries.push(timeSeries);
        return renderableChartModel;
      }, this._createDefaultRenderableChartModel(plotModel));
  }

  private _createTimeSeries(plotModel: PlotModel, component: PlotModelComponent, measurement: SimulationOutputMeasurement) {
    const timeSeries = this._findOrCreateTimeSeries(plotModel, component);
    const nextMeasurementValue = this._getNextMeasurementValue(plotModel, measurement);

    if (nextMeasurementValue === null) {
      // eslint-disable-next-line no-console
      console.warn(`No measurement found for component "${component.id}", plot name "${plotModel.name}"`);
    }
    return this._addValueToTimeSeries(timeSeries, nextMeasurementValue);
  }

  private _getNextMeasurementValue(plotModel: PlotModel, measurement: SimulationOutputMeasurement) {
    if (measurement !== undefined) {
      switch (plotModel.measurementType) {
        case MeasurementType.VOLTAGE:
          return measurement[plotModel.useMagnitude ? 'magnitude' : 'angle'];
        case MeasurementType.POWER:
          if (plotModel.useMagnitude) {
            return measurement['magnitude'] / 1000;
          } else {
            return measurement['angle'];
          }
        case MeasurementType.TAP:
          return measurement.value;
      }
    }
    return null;
  }

  private _resetRenderableChartModelsWhenSimulationStarts() {
    this._simulationManagementService.simulationStatusChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(status => status === SimulationStatus.STARTING && this._simulationManagementService.didUserStartActiveSimulation())
      )
      .subscribe({
        next: () => this._updateRenderableChartModels(true)
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
          this._stompClientService.readOnceFrom<FetchLimitsFileRequestPayload>(request.replyTo)
            .subscribe({
              next: payload => {
                const sqrt3 = Math.sqrt(3);
                for (const limit of payload.limits.voltages) {
                  /*
                    Get the percentage of nominal voltage for each ConnectivityNode
                    by taking the average of Alo and Ahi, then divide each measured
                    voltage value by this average, then find the min/average/max
                    voltages after applying the divisions.
                  */
                  this._nominalVoltageDivisorMap.set(limit.ConnectivityNode, ((limit.Alo + limit.Ahi) / 2) / sqrt3);
                }
                this._stateStore.update({
                  currentLimits: payload.limits.currents
                });
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
    this._activeSimulationStream.unsubscribe();
  }

  render() {
    const { renderableChartModels } = this.state;
    return (
      renderableChartModels.map(renderableChartModel => (
        <MeasurementChart
          key={renderableChartModel.name}
          renderableChartModel={renderableChartModel} />
      ))
    );
  }

}
