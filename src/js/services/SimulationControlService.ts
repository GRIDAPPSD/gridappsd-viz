import { Message, StompSubscription } from '@stomp/stompjs';

import { STOMP_CLIENT } from './stomp-client';
import { SimulationConfig } from '../models/SimulationConfig';
import { FncsOutputPayload } from '../models/message-requests/FncsOutputPayload';

/**
 * This class is responsible for communicating with the platform to process the simulation.
 * Simulation is started when the play button is clicked
 */
export class SimulationControlService {

  private static readonly _INSTANCE_: SimulationControlService = new SimulationControlService();

  private readonly _simulationRequestTopic = '/queue/goss.gridappsd.process.request.simulation';
  private readonly _simulationStatusTopic = '/topic/goss.gridappsd.simulation.log';
  private readonly _fncsOutputTopic = '/topic/goss.gridappsd.simulation.output.>';

  private constructor() {
  }

  static getInstance(): SimulationControlService {
    return SimulationControlService._INSTANCE_;
  }

  /**
   * Add a listener to be invoked when the platform sends back a message containing the data from
   * FNCS (Phoenix Server) topic
   * @param fn 
   */
  onFncsOutputReceived(fn: (payload: FncsOutputPayload) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._fncsOutputTopic, (message: Message) => {
      const payload = JSON.parse(message.body);
      if (payload.output) {
        // TODO: payload.output uses single quotes for keys instead of double quotes which is invalid for JSON string
        // Remove the replace() call when the backend creates a valid JSON string
        payload.output = JSON.parse(payload.output.replace(/'/g, '"'));
      }
      fn(payload);
    });
  }

  onSimulationStarted(fn: (simulationId: string) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._simulationRequestTopic, (message: Message) => fn(message.body));
  }

  onSimulationStatusLogReceived(simulationId: string, fn: (simulationStatusLog: string) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(`${this._simulationStatusTopic}.${simulationId}`, (message: Message) => fn(message.body));
  }

  startSimulation(simulationConfig: SimulationConfig) {
    STOMP_CLIENT.send(
      this._simulationRequestTopic,
      { 'reply-to': this._simulationRequestTopic },
      JSON.stringify(simulationConfig)
    );
  }

}