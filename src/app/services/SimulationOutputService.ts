import { ModelDictionaryMeasurement } from '../models/model-dictionary/ModelDictionaryMeasurement';
import { Subject, Observable } from 'rxjs';
import { SimulationOutputMeasurement } from '../models/simulation-output/SimulationOutputMeasurement';
import { SimulationControlService } from './SimulationControlService';

export class SimulationOutputService {
  private static readonly _INSTANCE = new SimulationOutputService();

  private readonly _simulationControlService = SimulationControlService.getInstance();

  private _modelDictionaryMeasurements: { [mRID: string]: ModelDictionaryMeasurement };
  private _simulationId: string;
  private _simulationTimestamp: number;
  private _simulationOutputMeasurementsStream = new Subject<SimulationOutputMeasurement[]>();

  private constructor() {
    this._subscribeToSimulationOutputTopic();
  }

  static getInstance() {
    return SimulationOutputService._INSTANCE;
  }

  getSimulationId() {
    return this._simulationId;
  }

  getSimulationTimestamp() {
    return this._simulationTimestamp;
  }

  setModelDictionaryMeasures(value: { [mRID: string]: ModelDictionaryMeasurement }) {
    this._modelDictionaryMeasurements = value;
  }

  simulationOutputMeasurementsReceived(): Observable<SimulationOutputMeasurement[]> {
    return this._simulationOutputMeasurementsStream.asObservable();
  }

  private _subscribeToSimulationOutputTopic() {
    const repeater = setInterval(() => {
      if (this._simulationControlService.isActive()) {
        this._simulationControlService.onSimulationOutputReceived(payload => {
          if (payload) {
            this._simulationId = payload.simulation_id;
            this._simulationTimestamp = payload.message.timestamp;
            const measurements: SimulationOutputMeasurement[] = payload.message.measurements.map(measurement => {
              const measurementInModelDictionary = this._modelDictionaryMeasurements[measurement.measurement_mrid];
              if (measurementInModelDictionary)
                return {
                  name: measurementInModelDictionary.name,
                  type: measurementInModelDictionary.measurementType,
                  magnitude: measurement.magnitude,
                  angle: measurement.angle,
                  value: measurement.value,
                  mRID: measurement.measurement_mrid,
                  phases: measurementInModelDictionary.phases,
                  conductingEquipmentName: measurementInModelDictionary.ConductingEquipment_name,
                  connectivityNode: measurementInModelDictionary.ConnectivityNode
                };
              return null;
            }).filter(e => e !== null);
            this._simulationOutputMeasurementsStream.next(measurements);
          }
        });
        clearInterval(repeater);
      }
    }, 500);
  }
}