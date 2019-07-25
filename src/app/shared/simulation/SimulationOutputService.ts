import { Subject, Observable, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { ModelDictionaryMeasurement } from '../topology/model-dictionary/ModelDictionaryMeasurement';
import { SimulationOutputMeasurement } from './SimulationOutputMeasurement';
import { StompClientService } from '@shared/StompClientService';
import { SIMULATION_OUTPUT_TOPIC } from './topics';
import { SimulationControlService, SimulationStatus } from './SimulationControlService';

export class SimulationOutputService {

  private static readonly _INSTANCE = new SimulationOutputService();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private _modelDictionaryMeasurements: Map<string, ModelDictionaryMeasurement>;
  private _outputTimestamp: number;
  private _simulationOutputMeasurementsStream = new Subject<SimulationOutputMeasurement[]>();
  private _simulationOutputSubscription: Subscription;

  private constructor() {
    this._watchStompClientStatusChanges();
  }

  private _watchStompClientStatusChanges() {
    return this._stompClientService.statusChanges()
      .subscribe({
        next: status => {
          switch (status) {
            case 'CONNECTING':
              if (this._simulationOutputSubscription)
                this._simulationOutputSubscription.unsubscribe();
              break;
            case 'CONNECTED':
              this._simulationOutputSubscription = this._subscribeToSimulationOutputTopic();
              break;
          }
        }
      });
  }

  static getInstance() {
    return SimulationOutputService._INSTANCE;
  }


  getOutputTimestamp() {
    return this._outputTimestamp;
  }

  setModelDictionaryMeasurements(value: Map<string, ModelDictionaryMeasurement>) {
    this._modelDictionaryMeasurements = value;
  }

  simulationOutputMeasurementsReceived(): Observable<SimulationOutputMeasurement[]> {
    return this._simulationOutputMeasurementsStream.asObservable();
  }

  private _subscribeToSimulationOutputTopic() {
    return this._stompClientService.readFrom(SIMULATION_OUTPUT_TOPIC)
      .pipe(
        filter(() => this._simulationControlService.currentStatus() === SimulationStatus.STARTED),
        map(body => JSON.parse(body)),
        filter(payload => Boolean(payload))
      )
      .subscribe({
        next: payload => {
          this._outputTimestamp = payload.message.timestamp;
          const measurements: SimulationOutputMeasurement[] = payload.message.measurements.map(measurement => {
            const measurementInModelDictionary = this._modelDictionaryMeasurements.get(measurement.measurement_mrid);
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
  }
}