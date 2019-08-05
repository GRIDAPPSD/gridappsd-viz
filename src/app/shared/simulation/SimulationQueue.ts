import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Simulation } from '@shared/simulation';

export class SimulationQueue {

  private static readonly _INSTANCE = new SimulationQueue();

  private readonly _activeSimulationChanged = new BehaviorSubject<Simulation>(null);
  private readonly _queueChanges = new Subject<Simulation[]>();
  private _simulations: Simulation[] = [];
  private _activeSimulation: Simulation;

  private constructor() {
  }

  static getInstance() {
    return SimulationQueue._INSTANCE;
  }

  activeSimulationChanged(): Observable<Simulation> {
    return this._activeSimulationChanged.asObservable()
      .pipe(filter(simulation => simulation !== null));
  }

  getActiveSimulation(): Simulation {
    return this._activeSimulation;
  }

  getAllSimulations(): Simulation[] {
    return this._simulations;
  }

  push(simulation: Simulation) {
    this._simulations = [{ ...simulation }, ...this._simulations.filter(sim => sim.name !== simulation.name)];
    this._activeSimulation = this._simulations[0];
    this._activeSimulationChanged.next(simulation);
    this._queueChanges.next(this._simulations);
  }

  queueChanges(): Observable<Simulation[]> {
    return this._queueChanges.asObservable();
  }

  updateIdOfActiveSimulation(id: string) {
    this._simulations = [
      { ...this._activeSimulation, id },
      ...this._simulations.filter(sim => sim !== this._activeSimulation)
    ];
    this._activeSimulation = this._simulations[0];
    this._queueChanges.next(this._simulations);
  }

  setActiveSimulation(simulationName: string) {
    const foundSimulation = this._simulations.filter(simulation => simulation.name === simulationName)[0];
    if (!foundSimulation)
      throw new Error(`No simulation found with the given name "${simulationName}"`);
    this._activeSimulation = foundSimulation;
    this._activeSimulationChanged.next(foundSimulation);
  }

}
