import { Message, StompSubscription } from '@stomp/stompjs';

import { StompClient } from './StompClient';
import { SimulationConfig } from '../models/SimulationConfig';
import { SimulationOutputPayload } from '../models/message-requests/SimulationOutputPayload';

/**
 * This class is responsible for communicating with the platform to process the simulation.
 * Simulation is started when the play button is clicked
 */
export class SimulationControlService {

  private static readonly _INSTANCE_: SimulationControlService = new SimulationControlService();
  private readonly _stompClient = StompClient.getInstance();
  private readonly _simulationRequestTopic = '/queue/goss.gridappsd.process.request.simulation';
  private readonly _simulationStatusTopic = '/topic/goss.gridappsd.simulation.log';
  private readonly _simulationOutputTopic = '/topic/goss.gridappsd.simulation.output.>';

  private constructor() {
  }

  static getInstance(): SimulationControlService {
    return SimulationControlService._INSTANCE_;
  }

  isActive() {
    return this._stompClient.isActive();
  }
  /**
   * Add a listener to be invoked when the platform sends back a message containing
   * simulation output data
   * @param fn 
   */
  onSimulationOutputReceived(fn: (payload: SimulationOutputPayload) => void): StompSubscription {
    return this._stompClient.subscribe(this._simulationOutputTopic, (message: Message) => {
      const payload = JSON.parse(message.body);
      // payload.output = JSON.parse(payload.replace(/'/g, '"'));
      fn(payload);
    });
  }

  onSimulationStarted(fn: (simulationId: string) => void): StompSubscription {
    return this._stompClient.subscribe(this._simulationRequestTopic, (message: Message) => fn(message.body));
  }

  onSimulationStatusLogReceived(simulationId: string, fn: (simulationStatusLog: string) => void): StompSubscription {
    return this._stompClient.subscribe(`${this._simulationStatusTopic}.${simulationId}`, (message: Message) => fn(message.body));
  }

  startSimulation(simulationConfig: SimulationConfig) {
    var startTime = new Date(simulationConfig.simulation_config.start_time);
    var startEpoch = startTime.getTime() / 1000.0;
    simulationConfig.simulation_config.start_time = JSON.stringify(startEpoch);
    this._stompClient.send(
      this._simulationRequestTopic,
      { 'reply-to': this._simulationRequestTopic },
      JSON.stringify(simulationConfig)
    );
  }

}
