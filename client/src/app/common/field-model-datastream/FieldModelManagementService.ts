import { Subject, Observable, Subscription, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { io } from 'socket.io-client';

import { StompClientService } from '@client:common/StompClientService';
import { FieldModelOutputStatus } from '@project:common/FieldModelOutputStatus';
import { SimulationSynchronizationEvent } from '@project:common/SimulationSynchronizationEvent';
import { ModelDictionaryMeasurement } from '@client:common/topology';
import { StateStore } from '@client:common/state-store';
import { ConductingEquipmentType } from '@client:common/topology/model-dictionary';
import { DEFAULT_FIELD_MODEL_CONFIGURATION } from '@client:common/field-model-datastream';

import { GetAvailableApplicationsRequestPayload, GetAvailableApplicationsAndServicesRequest } from '../../models/message-requests/GetAvailableApplicationsAndServicesRequest';

import { FIELD_OUTPUT_TOPIC } from './topics';

import { FieldModelOutputMeasurement, FieldModelOutputPayload } from '.';


interface FieldModelStartedEventResponse {
  simulationId: string;
  simulation_id?: number;
  events: Array<{
    allOutputOutage: boolean;
    allInputOutage: boolean;
    inputOutageList: Array<{ objectMRID: string; attribute: string }>;
    outputOutageList: string[];
    faultMRID: string;
    // eslint-disable-next-line camelcase
    event_type: string;
    occuredDateTime: number;
    stopDateTime: number;
    PhaseConnectedFaultKind: string;
    phases: string;
  }>;
}

/**
 * This class is responsible for communicating with the platform to process the field model output data stream.
 * The Field Model Output is received when user logged in and navigated to the /field-model route.
 */
export class FieldModelManagementService {

  private static readonly _INSTANCE_: FieldModelManagementService = new FieldModelManagementService();

  private readonly _stateStore = StateStore.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _currentFieldModelOutputStatusNotifer = new BehaviorSubject<FieldModelOutputStatus>(FieldModelOutputStatus.STOPPED);
  private readonly _socket = io();
  private readonly _fieldModelOutputMeasurementMapStream = new Subject<Map<string, FieldModelOutputMeasurement>>();

  private _currentFieldModelOutputStatus = FieldModelOutputStatus.STOPPED;
  private _didUserStartActiveFieldModelOutput = false;
  private _isUserInActiveFieldModelOutput = false;
  private _modelDictionaryMeasurementMap: Map<string, ModelDictionaryMeasurement> = null;
  private _outputTimestamp: number;
  private _fieldModelOutputSubscription: Subscription = null;
  private _currentFieldModelId = '';

  static getInstance(): FieldModelManagementService {
    return FieldModelManagementService._INSTANCE_;
  }

  private constructor() {
    this.startFieldModelOutput = this.startFieldModelOutput.bind(this);
    this.stopFieldModelOutput = this.stopFieldModelOutput.bind(this);
    this.isUserInActiveFieldModelOutput = this.isUserInActiveFieldModelOutput.bind(this);
  }

  didUserStartActiveFieldModelOutput() {
    return this._didUserStartActiveFieldModelOutput;
  }

  isUserInActiveFieldModelOutput() {
    return this._isUserInActiveFieldModelOutput;
  }

  getOutputTimestamp() {
    return this._outputTimestamp;
  }

  updateModelDictionaryMeasurementMap(newMap: Map<string, ModelDictionaryMeasurement>) {
    this._modelDictionaryMeasurementMap = newMap;
  }

  fieldModelOutputMeasurementMapReceived(): Observable<Map<string, FieldModelOutputMeasurement>> {
    return this._fieldModelOutputMeasurementMapStream.asObservable();
  }

  fieldModelOutputStatusChanges(): Observable<FieldModelOutputStatus> {
    return this._currentFieldModelOutputStatusNotifer.asObservable();
  }

  currentFieldModelOutputStatus() {
    return this._currentFieldModelOutputStatus;
  }

  startFieldModelOutput() {
    if (this._currentFieldModelOutputStatus !== FieldModelOutputStatus.STARTED && this._currentFieldModelOutputStatus !== FieldModelOutputStatus.STARTING) {
      this._fetchFieldModelMrid();
      this._stompClientService.readOnceFrom<GetAvailableApplicationsRequestPayload>('available-applications-and-services')
      .subscribe({
        next: payload => {
          if (payload.fieldModelMrid && payload.fieldModelMrid !== undefined && payload.fieldModelMrid !== '') {
            // eslint-disable-next-line camelcase
            DEFAULT_FIELD_MODEL_CONFIGURATION.power_system_config.Line_name = payload.fieldModelMrid;
          }
        }
      });
      this._didUserStartActiveFieldModelOutput = true;
      this._isUserInActiveFieldModelOutput = true;
      this._currentFieldModelOutputStatus = FieldModelOutputStatus.STARTING;
      this._currentFieldModelOutputStatusNotifer.next(FieldModelOutputStatus.STARTING);
      if (!this._fieldModelOutputSubscription) {
        this._fieldModelOutputSubscription = this._subscribeToFieldModelOutputTopic();
      }
      this._subscribeToStartFieldModelSimulationTopic();

      setTimeout(() => {
        this._stompClientService.send({
          destination: FIELD_OUTPUT_TOPIC,
          replyTo: FIELD_OUTPUT_TOPIC,
          body: ''
        });
      }, 1000);
    }
  }

  private _fetchFieldModelMrid() {
    const request = new GetAvailableApplicationsAndServicesRequest();
    this._stompClientService.send({
      destination: request.url,
      replyTo: request.replyTo,
      body: JSON.stringify(request.requestBody)
    });
  }

  private _subscribeToStartFieldModelSimulationTopic() {
    this._stompClientService.readOnceFrom<FieldModelStartedEventResponse>(FIELD_OUTPUT_TOPIC)
      .subscribe({
        next: payload => {
          this._currentFieldModelId = payload.simulation_id.toString();
          if (payload.events) {
            this._stateStore.update({
              simulationId: payload.simulationId,
              faultMRIDs: payload.events.map(event => event.faultMRID)
            });
          } else {
            this._stateStore.update({
              simulationId: payload.simulationId
            });
          }
        }
      });
  }

  private _subscribeToFieldModelOutputTopic() {
    return this._stompClientService.readFrom<FieldModelOutputPayload>(FIELD_OUTPUT_TOPIC)
      .pipe(
        filter(
          payload => {
            return (this._currentFieldModelOutputStatus === FieldModelOutputStatus.STARTED || this._currentFieldModelOutputStatus === FieldModelOutputStatus.STARTING) && Boolean(payload);
          }
        )
      )
      .subscribe({
      /**
       * @param payload the received fieldModel output datastream
       */
        next: payload => {
          this._broadcastFieldModelOutputMeasurements(payload);
        }
      });
  }

  private _broadcastFieldModelOutputMeasurements(payload: FieldModelOutputPayload) {
    this._outputTimestamp = payload.message.timestamp;
    const measurementMap = new Map<string, FieldModelOutputMeasurement>();
    for (const [mrid,rawFieldModelOutputMeasurement] of Object.entries(payload.message.measurements)) {
      const measurementInModelDictionary = this._modelDictionaryMeasurementMap.get(mrid);
      if (measurementInModelDictionary) {
        const measurement: FieldModelOutputMeasurement = {
          name: measurementInModelDictionary.name,
          type: measurementInModelDictionary.measurementType,
          magnitude: rawFieldModelOutputMeasurement.magnitude,
          angle: rawFieldModelOutputMeasurement.angle,
          mRID: rawFieldModelOutputMeasurement.mrid,
          phases: measurementInModelDictionary.phases,
          conductingEquipmentName: measurementInModelDictionary.ConductingEquipment_name,
          conductingEquipmentType: measurementInModelDictionary.ConductingEquipment_type as ConductingEquipmentType,
          connectivityNode: measurementInModelDictionary.ConnectivityNode,
          conductingEquipmentMRID: measurementInModelDictionary.ConductingEquipment_mRID
        };
        measurementMap.set(mrid, measurement);
      }
    }
    this._fieldModelOutputMeasurementMapStream.next(measurementMap);
  }

  private _updateSimulationStatus(newStatus: FieldModelOutputStatus) {
    this._currentFieldModelOutputStatus = newStatus;
    this._currentFieldModelOutputStatusNotifer.next(newStatus);
    this._socket.emit(
      SimulationSynchronizationEvent.QUERY_SIMULATION_STATUS,
      {
        status: newStatus,
        simulationId: this._currentFieldModelId
      }
    );
  }

  stopFieldModelOutput() {
    if (this._didUserStartActiveFieldModelOutput) {
      this._updateSimulationStatus(FieldModelOutputStatus.STOPPED);
      this._didUserStartActiveFieldModelOutput = false;
      this._isUserInActiveFieldModelOutput = false;
    }
  }

}
