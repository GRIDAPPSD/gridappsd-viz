import { Subject, Observable } from 'rxjs';

import { SimulationConfiguration } from './SimulationConfiguration';
import { StompClientService } from '@shared/StompClientService';
import { START_SIMULATION_TOPIC, CONTROL_SIMULATION_TOPIC } from './topics';
import { SimulationQueue } from './SimulationQueue';

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
  private readonly _simulationStatusNotifer = new Subject<SimulationStatus>();
  private _simulationStatus = SimulationStatus.NEW;

  private constructor() {
  }

  static getInstance(): SimulationControlService {
    return SimulationControlService._INSTANCE_;
  }

  statusChanged(): Observable<SimulationStatus> {
    return this._simulationStatusNotifer.asObservable();
  }

  startSimulation(simulationConfig: SimulationConfiguration) {
    if (this._simulationStatus !== SimulationStatus.STARTED) {
      const config = { ...simulationConfig };
      const startTime = new Date(simulationConfig.simulation_config.start_time.replace(/-/g, '/'));
      const startEpoch = startTime.getTime() / 1000.0;
      this._simulationStatus = SimulationStatus.STARTED;
      this._simulationStatusNotifer.next(SimulationStatus.STARTED);
      config.simulation_config = { ...simulationConfig.simulation_config };
      config.simulation_config.start_time = String(startEpoch);

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

  stopSimulation() {
    this._simulationStatusNotifer.next(SimulationStatus.STOPPED);
    this._sendSimulationControlCommand('stop');
  }

  pauseSimulation() {
    this._simulationStatusNotifer.next(SimulationStatus.PAUSED);
    this._sendSimulationControlCommand('pause');
  }

  resumeSimulation() {
    this._simulationStatusNotifer.next(SimulationStatus.RESUMED);
    this._sendSimulationControlCommand('resume');
  }

  private _sendSimulationControlCommand(command: 'stop' | 'pause' | 'resume') {
    const simulationId = this._simulationQueue.getActiveSimulation().id;
    this._stompClientService.send(`${CONTROL_SIMULATION_TOPIC}.${simulationId}`, {}, `{"command":"${command}"}`);
  }

}
