import { Subject, Observable } from 'rxjs';

import { Simulation } from '../models/Simulation';

export class SimulationQueue {
  private static readonly _INSTANCE = new SimulationQueue();

  private _simulations: Simulation[] = [];
  private _activeSimulation: Simulation;
  private _activeSimulationChanged = new Subject<Simulation>();
  private constructor() {

  }

  static getInstance() {
    return SimulationQueue._INSTANCE;
  }

  activeSimulationChanged(): Observable<Simulation> {
    return this._activeSimulationChanged.asObservable();
  }

  getActiveSimulation(): Simulation {
    if (!this._activeSimulation)
      throw new Error('No current active simulation');
    return this._activeSimulation;
  }

  getAllSimulations() {
    return this._simulations;
  }

  push(simulation: Simulation) {
    if (!this._contains(simulation))
      this._simulations.push(simulation);
    this._activeSimulation = simulation;
    this._activeSimulationChanged.next(simulation);
  }

  setActiveSimulation(simulationName: string) {
    const simulation = this._simulations.filter(simulation => simulation.name === simulationName)[0];
    if (!simulation)
      throw new Error(`No simulation found with the given name "${simulationName}"`);
    this._activeSimulation = simulation;
  }

  private _contains(simulation: Simulation) {
    return this._simulations.filter(e => e.name === simulation.name)[0] !== undefined;
  }
}