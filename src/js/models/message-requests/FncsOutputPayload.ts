export interface FncsOutputPayload {
  output: {
    simulation_id: string;
    message: {
      timestamp: string;
      measurements: Array<
      { magnitude: number; angle: number; measurement_mrid: string } &
      { measurement_mrid: string; value: number }
      >;
    }
  };
  command: string;
}