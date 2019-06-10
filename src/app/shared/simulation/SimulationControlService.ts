import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { SimulationConfiguration } from './SimulationConfiguration';
import { StompClientService } from '@shared/StompClientService';
import { START_SIMULATION_TOPIC, CONTROL_SIMULATION_TOPIC } from './topics';
import { SimulationQueue } from './SimulationQueue';
import { Store } from '@shared/Store';
import { ApplicationState } from '@shared/ApplicationState';

export const enum SimulationStatus {
  STARTED, PAUSED, STOPPED, NEW, RESUMED
}
/**
 * This class is responsible for communicating with the platform to process the simulation.
 * Simulation is started when the play button is clicked
 */
export class SimulationControlService {

  private static readonly _INSTANCE_: SimulationControlService = new SimulationControlService();

  private readonly _simulationQueue = SimulationQueue.getInstance();
  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _currentSimulationStatusNotifer = new Subject<SimulationStatus>();
  private readonly _store = Store.getInstance<ApplicationState>();
  private _currentSimulationStatus = SimulationStatus.NEW;

  private constructor() {
  }

  static getInstance(): SimulationControlService {
    return SimulationControlService._INSTANCE_;
  }

  statusChanges(): Observable<SimulationStatus> {
    return this._currentSimulationStatusNotifer.asObservable();
  }

  startSimulation(simulationConfig: SimulationConfiguration) {
    if (this._currentSimulationStatus !== SimulationStatus.STARTED) {
      const startTime = new Date(simulationConfig.simulation_config.start_time.replace(/-/g, '/'));
      const startEpoch = startTime.getTime() / 1000.0;
      const config: SimulationConfiguration = {
        ...simulationConfig,
        simulation_config: {
          ...simulationConfig.simulation_config,
          start_time: String(startEpoch)
        }
      };
      this._currentSimulationStatus = SimulationStatus.STARTED;
      this._currentSimulationStatusNotifer.next(SimulationStatus.STARTED);

      this._subscribeToStartSimulationTopic();

      // Let's wait for all the subscriptions in other components to this topic to complete
      // before sending the message
      setTimeout(() => {
        this._stompClientService.send(
          START_SIMULATION_TOPIC,
          { 'reply-to': START_SIMULATION_TOPIC },
          JSON.stringify(config)
        );
      }, 1000);
    }
  }

  private _subscribeToStartSimulationTopic() {
    this._stompClientService.readOnceFrom(START_SIMULATION_TOPIC)
      .pipe(map(body => JSON.parse(body)))
      .subscribe({
        next: payload => this._store.mergeState({ simulationStartResponse: payload })
      });
  }

  stopSimulation() {
    this._currentSimulationStatus = SimulationStatus.STOPPED;
    this._currentSimulationStatusNotifer.next(SimulationStatus.STOPPED);
    this._sendSimulationControlCommand('stop');
  }

  pauseSimulation() {
    this._currentSimulationStatus = SimulationStatus.PAUSED;
    this._currentSimulationStatusNotifer.next(SimulationStatus.PAUSED);
    this._sendSimulationControlCommand('pause');
  }

  resumeSimulation() {
    this._currentSimulationStatus = SimulationStatus.RESUMED;
    this._currentSimulationStatusNotifer.next(SimulationStatus.RESUMED);
    this._sendSimulationControlCommand('resume');
  }

  private _sendSimulationControlCommand(command: 'stop' | 'pause' | 'resume') {
    const simulationId = this._simulationQueue.getActiveSimulation().id;
    this._stompClientService.send(`${CONTROL_SIMULATION_TOPIC}.${simulationId}`, {}, `{"command":"${command}"}`);
  }

}