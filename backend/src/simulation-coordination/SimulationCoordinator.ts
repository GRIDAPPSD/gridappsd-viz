import { Socket } from 'socket.io';

import { SimulationParticipant } from './SimulationParticipant';
import { SimulationChannel } from './SimulationChannel';
import { SimulationSynchronizationEvents } from '@commons/SimulationSynchronizationEvents';
import { SimulationStatus } from '@commons/SimulationStatus';


interface SimulationInitiator {
  initiator: SimulationParticipant;
  simulationStatus: SimulationStatus;
}

export class SimulationCoordinator {

  private readonly _activeChannelMap = new Map<string, SimulationChannel>();
  private readonly _inactiveChannels: SimulationChannel[] = [];
  private readonly _simulationInitiatorMap = new Map<string, SimulationInitiator>();

  createNewParticipant(socket: Socket) {
    const participant = new SimulationParticipant(socket);
    participant.notifySelf(
      SimulationSynchronizationEvents.SIMULATION_ACTIVE_CHANNELS,
      [...this._simulationInitiatorMap.keys()].reverse()
    );
    return new SimulationParticipant(socket);
  }

  addParticipantToSimulationChannel(simulationId: string, participant: SimulationParticipant) {
    let requestedChannel = this._activeChannelMap.get(simulationId);
    if (!requestedChannel) {
      requestedChannel = this._inactiveChannels.pop() || new SimulationChannel();
      this._activeChannelMap.set(simulationId, requestedChannel);
    }
    const simulationInitiator = this._simulationInitiatorMap.get(simulationId);

    requestedChannel.activate(simulationInitiator.initiator, simulationInitiator.simulationStatus);
    requestedChannel.addMember(participant);
    participant.notifySelf(
      SimulationSynchronizationEvents.SIMULATION_STATUS,
      simulationInitiator.simulationStatus
    );
  }

  startSimulation(simulationId: string, simulationInitiator: SimulationParticipant) {
    this._simulationInitiatorMap.set(
      simulationId,
      {
        initiator: simulationInitiator,
        simulationStatus: SimulationStatus.STARTED
      }
    );
    simulationInitiator.watchForDisconnection()
      .then(() => this.deactivateSimulationChannel(simulationId, simulationInitiator));
    // Notify all other clients that are connected to our server
    simulationInitiator.broadcast(
      SimulationSynchronizationEvents.SIMULATION_ACTIVE_CHANNELS,
      [...this._simulationInitiatorMap.keys()].reverse()
    );
  }

  deactivateSimulationChannel(simulationId: string, channelHost: SimulationParticipant) {
    const requestedChannel = this._activeChannelMap.get(simulationId);
    if (requestedChannel) {
      requestedChannel.deactivate();
      // We only want to keep 16 inactive simulation channels around
      if (this._inactiveChannels.length < 16) {
        this._inactiveChannels.push(requestedChannel);
      }
      this._activeChannelMap.delete(simulationId);
    }
    this._simulationInitiatorMap.delete(simulationId);
    channelHost.broadcast(
      SimulationSynchronizationEvents.SIMULATION_ACTIVE_CHANNELS,
      [...this._simulationInitiatorMap.keys()]
    );
  }

  resumeSimulationChannel(simulationId: string) {
    this._activeChannelMap.get(simulationId)?.resume();
  }

  pauseSimulationChannel(simulationId: string) {
    this._activeChannelMap.get(simulationId)?.sleep();
  }

}
