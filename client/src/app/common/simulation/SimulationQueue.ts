import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Simulation } from './Simulation';
import { DEFAULT_SIMULATION_CONFIGURATION } from './default-simulation-configuration';

export class SimulationQueue {

  private static readonly _INSTANCE_ = new SimulationQueue();

  private readonly _activeSimulationChangeSubject = new BehaviorSubject<Simulation>(null);
  private readonly _queueChangeSubject = new Subject<Simulation[]>();

  private _simulations: Simulation[] = [];
  private _activeSimulation: Simulation = new Simulation(DEFAULT_SIMULATION_CONFIGURATION);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
  }

  static getInstance() {
    return SimulationQueue._INSTANCE_;
  }

  activeSimulationChanged(): Observable<Simulation> {
    return this._activeSimulationChangeSubject.asObservable()
      .pipe(filter(simulation => simulation !== null));
  }

  getActiveSimulation(): Simulation {
    return this._activeSimulation;
  }

  getAllSimulations(): Simulation[] {
    return this._simulations;
  }

  push(newSimulation: Simulation) {
    this._simulations.unshift(newSimulation);
    this._activeSimulation = newSimulation;
    this._activeSimulationChangeSubject.next(newSimulation);
    this._queueChangeSubject.next(this._simulations);
  }

  queueChanges(): Observable<Simulation[]> {
    return this._queueChangeSubject.asObservable();
  }

  updateIdOfActiveSimulation(id: string) {
    this._activeSimulation.id = id;
    this._queueChangeSubject.next(this._simulations);
  }

}
