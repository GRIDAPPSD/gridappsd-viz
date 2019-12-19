import { Subscription } from 'rxjs';

import { SimulationStatus } from '@commons/SimulationStatus';
import { SimulationParticipant } from './SimulationParticipant';
import { SimulationSnapshot } from '@commons/SimulationSnapshot';
import { SimulationSynchronizationEvents } from '@commons/SimulationSynchronizationEvents';

export class SimulationChannel {

  private readonly _members = new Set<SimulationParticipant>();

  private _simulationStatus = SimulationStatus.STOPPED;
  private _host: SimulationParticipant = null;
  private _simulationSnapshotWatchSubscription: Subscription;

  constructor() {

    this.deactivate = this.deactivate.bind(this);
  }

  currentStatus() {
    return this._simulationStatus;
  }

  addMember(member: SimulationParticipant) {
    if (this._host === null) {
      throw new Error(`Can't add new member because channel host is null`);
    }
    this._members.add(member);
    this._updateNewMemberWithLatestSimulationSnapshot(member);
  }

  private _updateNewMemberWithLatestSimulationSnapshot(newMember: SimulationParticipant) {
    this._host.listenOnceFor(SimulationSynchronizationEvents.SIMULATION_SNAPSHOT_INIT)
      .subscribe({
        next: snapshot => newMember.notifySelf(SimulationSynchronizationEvents.SIMULATION_SNAPSHOT_RECEIVE, snapshot)
      });
    this._host.notifySelf(SimulationSynchronizationEvents.SIMULATION_SNAPSHOT_INIT);
  }

  removeMember(member: SimulationParticipant) {
    this._members.delete(member);
  }

  activate(host: SimulationParticipant, hostStatus: SimulationStatus) {
    if (this._simulationStatus === SimulationStatus.STOPPED) {
      this._host = host;
      this._simulationSnapshotWatchSubscription = this._beginSendingSimulationSnapshotsToAllMembers();
      this._host.watchForDisconnection()
        .then(this.deactivate);
      this._simulationStatus = hostStatus;
    }
  }

  private _beginSendingSimulationSnapshotsToAllMembers() {
    return this._host.listenFor<SimulationSnapshot>(SimulationSynchronizationEvents.SIMULATION_SNAPSHOT_RECEIVE)
      .subscribe({
        next: simulationSnapshot => {
          this._notifyAllMembers(SimulationSynchronizationEvents.SIMULATION_SNAPSHOT_RECEIVE, simulationSnapshot);
        }
      });
  }

  private _notifyAllMembers(event: SimulationSynchronizationEvents, payload?: any) {
    for (const member of this._members) {
      if (member.isConnected())
        member.notifySelf(event, payload);
      else
        this._members.delete(member);
    }
  }

  deactivate() {
    if (this._host) {
      this._simulationStatus = SimulationStatus.STOPPED;
      this._notifyAllMembers(SimulationSynchronizationEvents.SIMULATION_STATUS, this._simulationStatus);
      this._members.clear();
      this._host = null;
      this._simulationSnapshotWatchSubscription.unsubscribe();
    }
  }

  resume() {
    this._simulationStatus = SimulationStatus.RESUMED;
    this._notifyAllMembers(SimulationSynchronizationEvents.SIMULATION_STATUS, this._simulationStatus);
  }

  sleep() {
    this._simulationStatus = SimulationStatus.PAUSED;
    this._notifyAllMembers(SimulationSynchronizationEvents.SIMULATION_STATUS, this._simulationStatus);
  }

}
