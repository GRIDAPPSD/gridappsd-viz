import { Subject, Observable } from 'rxjs';

import { SimulationConfiguration } from './SimulationConfiguration';
import { StompClientService } from '@shared/StompClientService';
import { START_SIMULATION_TOPIC } from './topics';

export const enum SimulationStatus {
  STARTED, PAUSED, STOPPED, NEW
}
/**
 * This class is responsible for communicating with the platform to process the simulation.
 * Simulation is started when the play button is clicked
 */
export class SimulationControlService {

  private static readonly _INSTANCE_: SimulationControlService = new SimulationControlService();
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

}
