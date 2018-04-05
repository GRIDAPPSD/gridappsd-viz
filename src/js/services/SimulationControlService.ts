import { Message, StompSubscription } from '@stomp/stompjs';

import { STOMP_CLIENT } from './MessageService';
import { SimulationConfig } from '../models/SimulationConfig';

export class SimulationControlService {

  private static readonly _INSTANCE_: SimulationControlService = new SimulationControlService();

  private readonly _simulationRequestTopic = '/queue/goss.gridappsd.process.request.simulation';
  private readonly _simulationStatusTopic = '/topic/goss.gridappsd.simulation.log';
  private readonly _fncsOutputTopic = '/topic/goss.gridappsd.fncs.output';

  private constructor() {
  }

  static getInstance(): SimulationControlService {
    return SimulationControlService._INSTANCE_;
  }

  onFncsOutputReceived(fn: (data: any) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._fncsOutputTopic, (message: Message) => fn(JSON.parse(message.body)));
  }

  onSimulationStarted(fn: (simulationId: string) => void): StompSubscription {
    return STOMP_CLIENT.subscribe(this._simulationRequestTopic, (message: Message) => fn(JSON.parse(message.body)));
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