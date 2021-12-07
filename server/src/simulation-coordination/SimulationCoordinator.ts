import { Socket } from 'socket.io';

import { SimulationSynchronizationEvent } from '@project:common/SimulationSynchronizationEvent';

import { SimulationParticipant } from './SimulationParticipant';
import { SimulationChannel } from './SimulationChannel';

export class SimulationCoordinator {

  private readonly _activeSimulationChannelMap = new Map<string, SimulationChannel>();

  createNewParticipant(socket: Socket) {
    const participant = new SimulationParticipant(socket);
    if (this._activeSimulationChannelMap.size > 0) {
      participant.notifySelf(
        SimulationSynchronizationEvent.QUERY_ACTIVE_SIMULATION_CHANNELS,
        [...this._activeSimulationChannelMap.keys()].reverse()
      );
    }
    return new SimulationParticipant(socket);
  }

  addParticipantToSimulationChannel(simulationId: string, participant: SimulationParticipant) {
    const requestedChannel = this._activeSimulationChannelMap.get(simulationId);
    requestedChannel.addMember(participant);
    participant.notifySelf(
      SimulationSynchronizationEvent.QUERY_SIMULATION_STATUS,
      requestedChannel.currentSimulationStatus()
    );
  }

  startSimulationChannel(simulationId: string, simulationInitiator: SimulationParticipant) {
    const newSimulationChannel = new SimulationChannel(simulationInitiator);
    newSimulationChannel.activate();
    this._activeSimulationChannelMap.set(simulationId, newSimulationChannel);
    simulationInitiator.watchForDisconnection()
      .then(() => this.deactivateSimulationChannel(simulationId, simulationInitiator));
    // Notify all other clients that are connected to our server
    simulationInitiator.broadcast(
      SimulationSynchronizationEvent.QUERY_ACTIVE_SIMULATION_CHANNELS,
      [...this._activeSimulationChannelMap.keys()].reverse()
    );
  }

  deactivateSimulationChannel(simulationId: string, channelHost: SimulationParticipant) {
    const requestedChannel = this._activeSimulationChannelMap.get(simulationId);
    if (requestedChannel) {
      requestedChannel.deactivate();
      this._activeSimulationChannelMap.delete(simulationId);
      channelHost.broadcast(
        SimulationSynchronizationEvent.QUERY_ACTIVE_SIMULATION_CHANNELS,
        [...this._activeSimulationChannelMap.keys()].reverse()
      );
    }
  }

  resumeSimulationChannel(simulationId: string) {
    this._activeSimulationChannelMap.get(simulationId).resume();
  }

  pauseSimulationChannel(simulationId: string) {
    this._activeSimulationChannelMap.get(simulationId).sleep();
  }

}
