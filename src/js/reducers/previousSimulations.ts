import { Simulation } from "../models/Simulation";
import { SimulationActions, ADD_SIMULATION } from "../actions/simulation-actions";

export function previousSimulations(state: Simulation[] = [], action: SimulationActions): Simulation[] {
  switch (action.type) {
    case ADD_SIMULATION:
      return state.filter(sim => sim.name !== action.simulation.name).concat(action.simulation);
    default:
      return state;
  }
}