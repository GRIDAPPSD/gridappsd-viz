/* eslint-disable camelcase */
export interface FieldModelOutputPayload {
    simulation_id: string;
    message: {
      measurements: {
        [mrid: string]: { magnitude: number; angle: number; mrid: string };
      };
      timestamp: number;
    };
  }
