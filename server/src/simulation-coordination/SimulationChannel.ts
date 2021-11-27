import { Subscription } from 'rxjs';

import { SimulationStatus } from '@project:common/SimulationStatus';
import { SimulationSnapshot } from '@project:common/SimulationSnapshot';
import { SimulationSynchronizationEvent } from '@project:common/SimulationSynchronizationEvent';

import { SimulationParticipant } from './SimulationParticipant';

export class SimulationChannel {

  private readonly _members = new Set<SimulationParticipant>();

  private _simulationStatus = SimulationStatus.STOPPED;
  private _simulationSnapshotWatchSubscription: Subscription;

  constructor(private readonly _host: SimulationParticipant) {
  }

  currentSimulationStatus() {
    return this._simulationStatus;
  }

  addMember(member: SimulationParticipant) {
    if (this._host === null) {
      // eslint-disable-next-line @typescript-eslint/quotes
      throw new Error(`Can't add new member because channel host is null`);
    }
    this._members.add(member);
    this._updateNewMemberWithLatestSimulationSnapshot(member);
  }

  private _updateNewMemberWithLatestSimulationSnapshot(newMember: SimulationParticipant) {
    this._host.listenOnceFor(SimulationSynchronizationEvent.INIT_SIMULATION_SNAPSHOT)
      .subscribe({
        next: snapshot => newMember.notifySelf(SimulationSynchronizationEvent.RECEIVE_SIMULATION_SNAPSHOT, snapshot)
      });
    this._host.notifySelf(SimulationSynchronizationEvent.INIT_SIMULATION_SNAPSHOT);
  }

  activate() {
    if (this._simulationStatus === SimulationStatus.STOPPED) {
      this._simulationSnapshotWatchSubscription = this._beginSendingSimulationSnapshotsToAllMembers();
      this._simulationStatus = SimulationStatus.STARTED;
    }
  }

  private _beginSendingSimulationSnapshotsToAllMembers() {
    return this._host.listenFor<SimulationSnapshot>(SimulationSynchronizationEvent.RECEIVE_SIMULATION_SNAPSHOT)
      .subscribe({
        next: simulationSnapshot => {
          this._notifyAllMembers(SimulationSynchronizationEvent.RECEIVE_SIMULATION_SNAPSHOT, simulationSnapshot);
        }
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _notifyAllMembers(event: SimulationSynchronizationEvent, payload?: any) {
    for (const member of this._members) {
      if (member.isConnected()) {
        member.notifySelf(event, payload);
      } else {
        this._members.delete(member);
      }
    }
  }

  deactivate() {
    this._simulationStatus = SimulationStatus.STOPPED;
    this._notifyAllMembers(SimulationSynchronizationEvent.QUERY_SIMULATION_STATUS, this._simulationStatus);
    this._members.clear();
    this._simulationSnapshotWatchSubscription.unsubscribe();
  }

  resume() {
    this._simulationStatus = SimulationStatus.RESUMED;
    this._notifyAllMembers(SimulationSynchronizationEvent.QUERY_SIMULATION_STATUS, this._simulationStatus);
  }

  sleep() {
    this._simulationStatus = SimulationStatus.PAUSED;
    this._notifyAllMembers(SimulationSynchronizationEvent.QUERY_SIMULATION_STATUS, this._simulationStatus);
  }

}
