import { Socket } from 'socket.io';
import { Subject } from 'rxjs';
import { take, finalize, takeUntil } from 'rxjs/operators';

import { SimulationStatus } from '@commons/SimulationStatus';
import { SimulationSynchronizationEvent } from '@commons/SimulationSynchronizationEvent';

/**
 * A simulation participant is those clients that have joined a running simulation
 */
export class SimulationParticipant {

  private readonly _disconnectNotifier = new Subject<void>();
  private readonly _simulationStatusChangeNotifier = new Subject<{ status: SimulationStatus; simulationId: string }>();

  constructor(private readonly _socket: Socket) {
    _socket.on('disconnect', () => {
      this._disconnectNotifier.next();
      this._disconnectNotifier.complete();
      this._socket.removeAllListeners();
    });

    _socket.on(SimulationSynchronizationEvent.QUERY_SIMULATION_STATUS, (payload: { status: SimulationStatus; simulationId: string }) => {
      this._simulationStatusChangeNotifier.next(payload);
    });
  }

  isConnected() {
    return this._socket.connected;
  }

  listenFor<T = any>(event: SimulationSynchronizationEvent) {
    const notifier = new Subject<T>();
    this._socket.on(event, (payload?: T) => notifier.next(payload));
    return notifier.asObservable()
      .pipe(
        finalize(() => this._socket.removeAllListeners(event)),
        takeUntil(this._disconnectNotifier)
      );
  }

  listenOnceFor<T>(event: SimulationSynchronizationEvent) {
    return this.listenFor<T>(event)
      .pipe(take(1));
  }

  notifySelf(event: SimulationSynchronizationEvent, payload?: any) {
    this._socket.emit(event, payload);
  }

  broadcast(event: SimulationSynchronizationEvent, payload?: any) {
    this._socket.broadcast.emit(event, payload);
  }

  simulationStatusChanges() {
    return this._simulationStatusChangeNotifier.asObservable()
      .pipe(takeUntil(this._disconnectNotifier));
  }

  requestToJoinSimulationChannel() {
    return this.listenFor<string>(SimulationSynchronizationEvent.JOIN_SIMULATION);
  }

  watchForDisconnection() {
    return new Promise<void>(resolve => {
      this._disconnectNotifier
        .subscribe({
          complete: resolve
        });
    });
  }

}
