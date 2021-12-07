/* eslint-disable camelcase */
export interface SimulationOutputPayload {
  simulation_id: string;
  message: {
    timestamp: number;
    measurements: {
      [mrid: string]: { magnitude: number; angle: number; measurement_mrid: string } & { measurement_mrid: string; value: number };
    };
  };
}
