import { Subject, Observable, Subscription, BehaviorSubject, timer } from 'rxjs';
import { filter, pluck, debounce, takeWhile, switchMap } from 'rxjs/operators';
import { io } from 'socket.io-client';

import { StompClientService, StompClientConnectionStatus } from '@client:common/StompClientService';
import { SimulationStatus } from '@project:common/SimulationStatus';
import { SimulationSnapshot, DEFAULT_SIMULATION_SNAPSHOT } from '@project:common/SimulationSnapshot';
import { SimulationSynchronizationEvent } from '@project:common/SimulationSynchronizationEvent';
import { ModelDictionaryMeasurement } from '@client:common/topology';
import { StateStore } from '@client:common/state-store';
import { ConductingEquipmentType } from '@client:common/topology/model-dictionary';
import { DateTimeService } from '@client:common/DateTimeService';

import { Simulation } from './Simulation';
import { SimulationStatusLogMessage } from './SimulationStatusLogMessage';
import { SimulationQueue } from './SimulationQueue';
import { START_SIMULATION_TOPIC, CONTROL_SIMULATION_TOPIC, SIMULATION_OUTPUT_TOPIC, SIMULATION_STATUS_LOG_TOPIC } from './topics';
import { SimulationConfiguration } from './SimulationConfiguration';

import { SimulationOutputMeasurement, SimulationOutputPayload } from '.';

interface SimulationStartedEventResponse {
  simulationId: string;
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
 * This class is responsible for communicating with the platform to process the simulation.
 * Simulation is started when the play button is clicked
 */
export class SimulationManagementService {

  private static readonly _INSTANCE_: SimulationManagementService = new SimulationManagementService();

  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stateStore = StateStore.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _currentSimulationStatusNotifer = new BehaviorSubject<SimulationStatus>(SimulationStatus.STOPPED);
  private readonly _socket = io();
  private readonly _simulationSnapshot: SimulationSnapshot = DEFAULT_SIMULATION_SNAPSHOT;
  private readonly _simulationSnapshotReceivedNotifier = new BehaviorSubject<SimulationSnapshot>({} as SimulationSnapshot);
  private readonly _simulationOutputMeasurementMapStream = new Subject<Map<string, SimulationOutputMeasurement>>();

  private _currentSimulationStatus = SimulationStatus.STOPPED;
  private _didUserStartActiveSimulation = false;
  private _isUserInActiveSimulation = false;
  private _modelDictionaryMeasurementMap: Map<string, ModelDictionaryMeasurement> = null;
  private _outputTimestamp: number;
  private _simulationOutputSubscription: Subscription = null;
  private _simulationStatusLogStreamSubscription: Subscription;
  private _currentSimulationId = '';
  private _syncingEnabled = false;

  static getInstance(): SimulationManagementService {
    return SimulationManagementService._INSTANCE_;
  }

  private constructor() {

    this._onActiveSimulationIdsReceived();
    this._onSimulationStatusChangedUpstream();
    this._onSendFirstSimulationSnapshot();
    this._onSimulationSnapshotReceived();
    this._watchStompClientStatusChanges();
    this._onActiveSimulationSnapshotStateReceived();
    this._onSimulationOutputSnapshotStateReceived();

    this.startSimulation = this.startSimulation.bind(this);
    this.stopSimulation = this.stopSimulation.bind(this);
    this.pauseSimulation = this.pauseSimulation.bind(this);
    this.resumeSimulation = this.resumeSimulation.bind(this);
    this.requestToJoinActiveSimulation = this.requestToJoinActiveSimulation.bind(this);
    this.isUserInActiveSimulation = this.isUserInActiveSimulation.bind(this);
    this.resumeThenPauseSimulationAfter = this.resumeThenPauseSimulationAfter.bind(this);
  }

  /**
   * Because the user can join simulations started by someone else, we check the server here to see
   * if there are any existing simulations currently
   */
  private _onActiveSimulationIdsReceived() {
    this._socket.on(SimulationSynchronizationEvent.QUERY_ACTIVE_SIMULATION_CHANNELS, (activeSimulationIds: string[]) => {
      this._stateStore.update({
        activeSimulationIds: activeSimulationIds.filter(e => e !== this._currentSimulationId)
      });
    });
  }

  /**
   * Check if the current simulation that this user is in had its simulation status updated
   * by someone else
   */
  private _onSimulationStatusChangedUpstream() {
    this._socket.on(SimulationSynchronizationEvent.QUERY_SIMULATION_STATUS, (status: SimulationStatus) => {
      this._currentSimulationStatus = status;
      this._currentSimulationStatusNotifer.next(status);
      if (status === SimulationStatus.STOPPED) {
        this._isUserInActiveSimulation = false;
      }
    });
  }

  /**
   * When some other user requests to join a currently running simulation, we want to sync the current
   * state of the simulation when that other user joins so that they can see the state of the simulation
   * up until that point
   */
  private _onSendFirstSimulationSnapshot() {
    this._socket.on(SimulationSynchronizationEvent.INIT_SIMULATION_SNAPSHOT, () => {
      this._syncingEnabled = true;
      this._simulationSnapshot.stateStore = this._stateStore.toJson();
      this._simulationSnapshot.activeSimulation = this._simulationQueue.getActiveSimulation();
      this._socket.emit(SimulationSynchronizationEvent.INIT_SIMULATION_SNAPSHOT, this._simulationSnapshot);
    });
  }

  /**
   * Watch for new simulation snapshots. When the user joins a simulation, if there is new update to simulation
   * states, they are packaged into a snapshot and are then broadcast to every simulation participant over websocket
   */
  private _onSimulationSnapshotReceived() {
    this._socket.on(SimulationSynchronizationEvent.RECEIVE_SIMULATION_SNAPSHOT, (snapshot: SimulationSnapshot) => {
      this._simulationSnapshotReceivedNotifier.next(snapshot);
    });
  }

  private _watchStompClientStatusChanges() {
    return this._stompClientService.statusChanges()
      .pipe(filter(status => status === StompClientConnectionStatus.CONNECTED))
      .subscribe({
        next: () => {
          if (this._simulationOutputSubscription !== null) {
            this._simulationOutputSubscription.unsubscribe();
            this._simulationOutputSubscription = null;
            this.stopSimulation();
          }
        }
      });
  }

  /**
   * If there is a change in the current `activeSimulation` object,
   * then we want to retrieve it and store it into the queue of existing simulations
   */
  private _onActiveSimulationSnapshotStateReceived() {
    this.selectSimulationSnapshotState('activeSimulation')
      .pipe(filter(value => value !== null))
      .subscribe({
        next: (activeSimulation: Simulation) => this._simulationQueue.push(activeSimulation)
      });
  }

  /**
   * Get the simulation output from the simulation snapshot
   */
  private _onSimulationOutputSnapshotStateReceived() {
    this.selectSimulationSnapshotState('simulationOutput')
      .pipe(
        filter(value => value !== null),
        debounce(() => timer(0, 16).pipe(takeWhile(() => this._modelDictionaryMeasurementMap === null)))
      )
      .subscribe({
        next: (simulationOutput: SimulationOutputPayload) => this._broadcastSimulationOutputMeasurements(simulationOutput)
      });
  }

  selectSimulationSnapshotState<K extends keyof SimulationSnapshot>(key: K): Observable<SimulationSnapshot[K]> {
    return this._simulationSnapshotReceivedNotifier.asObservable()
      .pipe(
        filter(snapshot => key in snapshot),
        pluck(key)
      );
  }

  requestToJoinActiveSimulation(simulationId: string) {
    this._isUserInActiveSimulation = true;
    this._socket.emit(SimulationSynchronizationEvent.JOIN_SIMULATION, simulationId);
  }

  didUserStartActiveSimulation() {
    return this._didUserStartActiveSimulation;
  }

  isUserInActiveSimulation() {
    return this._isUserInActiveSimulation;
  }

  getOutputTimestamp() {
    return this._outputTimestamp;
  }

  updateModelDictionaryMeasurementMap(newMap: Map<string, ModelDictionaryMeasurement>) {
    this._modelDictionaryMeasurementMap = newMap;
  }

  simulationOutputMeasurementMapReceived(): Observable<Map<string, SimulationOutputMeasurement>> {
    return this._simulationOutputMeasurementMapStream.asObservable();
  }

  syncSimulationSnapshotState<K extends keyof SimulationSnapshot>(state: Pick<SimulationSnapshot, K>) {
    for (const entry of Object.entries(state)) {
      this._simulationSnapshot[entry[0]] = entry[1];
    }
    if (this._syncingEnabled) {
      this._socket.emit(SimulationSynchronizationEvent.RECEIVE_SIMULATION_SNAPSHOT, state);
    }
  }

  simulationStatusChanges(): Observable<SimulationStatus> {
    return this._currentSimulationStatusNotifer.asObservable();
  }

  currentSimulationStatus() {
    return this._currentSimulationStatus;
  }

  startSimulation() {
    if (this._currentSimulationStatus !== SimulationStatus.STARTED && this._currentSimulationStatus !== SimulationStatus.STARTING) {
      const activeSimulation = this._simulationQueue.getActiveSimulation();
      const simulationConfig = activeSimulation.config;
      const startTime = DateTimeService.getInstance().parse(simulationConfig.simulation_config.start_time);
      const config: SimulationConfiguration = {
        ...simulationConfig,
        // eslint-disable-next-line camelcase
        simulation_config: {
          ...simulationConfig.simulation_config,
          // eslint-disable-next-line camelcase
          start_time: String(startTime)
        }
      };
      activeSimulation.didRun = true;
      this._didUserStartActiveSimulation = true;
      this._isUserInActiveSimulation = true;
      this._currentSimulationStatus = SimulationStatus.STARTING;
      this._currentSimulationStatusNotifer.next(SimulationStatus.STARTING);
      if (!this._simulationOutputSubscription) {
        this._simulationOutputSubscription = this._subscribeToSimulationOutputTopic();
      }
      this._subscribeToStartSimulationTopic();
      this._readSimulationProcessStatusFromSimulationLogStream();
      // Reset this state
      this.syncSimulationSnapshotState({
        simulationOutput: null
      });

      // Let's wait for all the subscriptions in other components to this topic to complete
      // before sending the message
      setTimeout(() => {
        this._stompClientService.send({
          destination: START_SIMULATION_TOPIC,
          replyTo: START_SIMULATION_TOPIC,
          body: JSON.stringify(config)
        });
      }, 1000);
    }
  }

  private _subscribeToSimulationOutputTopic() {
    return this._stompClientService.readFrom<SimulationOutputPayload>(SIMULATION_OUTPUT_TOPIC)
      .pipe(
        filter(
          payload => (this._currentSimulationStatus === SimulationStatus.STARTED || this._currentSimulationStatus === SimulationStatus.RESUMED) && Boolean(payload)
        )
      )
      .subscribe({
        next: payload => {
          if (this._syncingEnabled) {
            this.syncSimulationSnapshotState({
              simulationOutput: payload
            });
          }
          this._broadcastSimulationOutputMeasurements(payload);
        }
      });
  }

  private _broadcastSimulationOutputMeasurements(payload: SimulationOutputPayload) {
    this._outputTimestamp = payload.message.timestamp;
    const measurementMap = new Map<string, SimulationOutputMeasurement>();
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
          conductingEquipmentType: measurementInModelDictionary.ConductingEquipment_type as ConductingEquipmentType,
          connectivityNode: measurementInModelDictionary.ConnectivityNode,
          conductingEquipmentMRID: measurementInModelDictionary.ConductingEquipment_mRID
        };
        measurementMap.set(mrid, measurement);
        //measurementMap.set(measurementInModelDictionary.ConductingEquipment_name, measurement);
        //measurementMap.set(measurementInModelDictionary.ConnectivityNode, measurement);
      }
    }
    this._simulationOutputMeasurementMapStream.next(measurementMap);
  }

  private _subscribeToStartSimulationTopic() {
    this._stompClientService.readOnceFrom<SimulationStartedEventResponse>(START_SIMULATION_TOPIC)
      .subscribe({
        next: payload => {
          this._currentSimulationId = payload.simulationId;
          this._simulationQueue.updateIdOfActiveSimulation(payload.simulationId);
          this._stateStore.update({
            simulationId: payload.simulationId,
            faultMRIDs: payload.events.map(event => event.faultMRID)
          });
        }
      });
  }

  private _readSimulationProcessStatusFromSimulationLogStream() {
    this._simulationStatusLogStreamSubscription = this._stateStore.select('simulationId')
      .pipe(
        filter(simulationId => simulationId !== ''),
        switchMap(id => this._stompClientService.readFrom<SimulationStatusLogMessage>(`${SIMULATION_STATUS_LOG_TOPIC}.${id}`)),
        takeWhile(message => message.processStatus !== 'COMPLETE')
      )
      .subscribe({
        next: message => {
          if (message.processStatus === 'STARTED') {
            this._updateSimulationStatus(SimulationStatus.STARTED);
          } else if (message.processStatus === 'PAUSED') {
            this._updateSimulationStatus(SimulationStatus.PAUSED);
          }
        },
        complete: this.stopSimulation
      });
  }

  private _updateSimulationStatus(newStatus: SimulationStatus) {
    this._currentSimulationStatus = newStatus;
    this._currentSimulationStatusNotifer.next(newStatus);
    this._socket.emit(
      SimulationSynchronizationEvent.QUERY_SIMULATION_STATUS,
      {
        status: newStatus,
        simulationId: this._currentSimulationId
      }
    );
  }

  stopSimulation() {
    if (this._didUserStartActiveSimulation) {
      this._updateSimulationStatus(SimulationStatus.STOPPED);
      this._simulationStatusLogStreamSubscription.unsubscribe();
      this._sendSimulationControlCommand('stop');
      this._didUserStartActiveSimulation = false;
      this._isUserInActiveSimulation = false;
      this._syncingEnabled = false;
    }
  }

  pauseSimulation() {
    this._sendSimulationControlCommand('pause');
  }

  resumeSimulation() {
    this._updateSimulationStatus(SimulationStatus.RESUMED);
    this._sendSimulationControlCommand('resume');
  }

  private _sendSimulationControlCommand(command: 'stop' | 'pause' | 'resume') {
    this._stompClientService.send({
      destination: `${CONTROL_SIMULATION_TOPIC}.${this._currentSimulationId}`,
      body: `{"command":"${command}"}`
    });
  }

  resumeThenPauseSimulationAfter(seconds: number) {
    this._updateSimulationStatus(SimulationStatus.RESUMED);
    setTimeout(() => {
      this._updateSimulationStatus(SimulationStatus.PAUSED);
    }, seconds * 1000);
    this._stompClientService.send({
      destination: `${CONTROL_SIMULATION_TOPIC}.${this._currentSimulationId}`,
      body: JSON.stringify({
        command: 'resumePauseAt',
        input: {
          pauseIn: seconds
        }
      })
    });
  }

}
