import { Subject, Observable, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { ModelDictionaryMeasurement } from '../topology/model-dictionary/ModelDictionaryMeasurement';
import { SimulationOutputMeasurement } from './SimulationOutputMeasurement';
import { StompClientService } from '@shared/StompClientService';
import { SIMULATION_OUTPUT_TOPIC } from './topics';
import { SimulationControlService, SimulationStatus } from './SimulationControlService';
import { SimulationOutputPayload } from './SimulationOutputPayload';

export class SimulationOutputService {

  private static readonly _INSTANCE = new SimulationOutputService();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _simulationControlService = SimulationControlService.getInstance();
  private _modelDictionaryMeasurementMap: Map<string, ModelDictionaryMeasurement>;
  private _outputTimestamp: number;
  private _simulationOutputMeasurementsStream = new Subject<Map<string, SimulationOutputMeasurement>>();
  private _simulationOutputSubscription: Subscription;

  static getInstance() {
    return SimulationOutputService._INSTANCE;
  }

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

  getOutputTimestamp() {
    return this._outputTimestamp;
  }

  updateModelDictionaryMeasurementMap(newMap: Map<string, ModelDictionaryMeasurement>) {
    this._modelDictionaryMeasurementMap = newMap;
  }

  simulationOutputMeasurementsReceived(): Observable<Map<string, SimulationOutputMeasurement>> {
    return this._simulationOutputMeasurementsStream.asObservable();
  }

  private _subscribeToSimulationOutputTopic() {
    return this._stompClientService.readFrom(SIMULATION_OUTPUT_TOPIC)
      .pipe(
        filter(() => this._simulationControlService.currentStatus() === SimulationStatus.STARTED),
        map(JSON.parse as (value: string) => SimulationOutputPayload),
        filter(payload => Boolean(payload))
      )
      .subscribe({
        next: payload => {
          this._outputTimestamp = payload.message.timestamp;
          const measurements = new Map<string, SimulationOutputMeasurement>();
          for (const [mrid, rawSimulationOutputMeasurement] of Object.entries(payload.message.measurements)) {
            const measurementInModelDictionary = this._modelDictionaryMeasurementMap.get(mrid);
            if (measurementInModelDictionary) {
              const measurement: SimulationOutputMeasurement = {
                name: measurementInModelDictionary.name,
                type: measurementInModelDictionary.measurementType,
                magnitude: rawSimulationOutputMeasurement.magnitude,
                angle: rawSimulationOutputMeasurement.angle,
                value: rawSimulationOutputMeasurement.value,
                mRID: rawSimulationOutputMeasurement.measurement_mrid,
                phases: measurementInModelDictionary.phases,
                conductingEquipmentName: measurementInModelDictionary.ConductingEquipment_name,
                connectivityNode: measurementInModelDictionary.ConnectivityNode,
                conductingEquipmentMRID: measurementInModelDictionary.ConductingEquipment_mRID
              };
              measurements.set(mrid, measurement);
              measurements.set(measurementInModelDictionary.ConductingEquipment_name, measurement);
              measurements.set(measurementInModelDictionary.ConnectivityNode, measurement);
            }
          }
          this._simulationOutputMeasurementsStream.next(measurements);
        }
      });
  }

}
