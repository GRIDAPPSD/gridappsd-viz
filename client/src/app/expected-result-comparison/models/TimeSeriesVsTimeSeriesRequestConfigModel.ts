export interface TimeSeriesVsTimeSeriesRequestConfigModel {
  lineName: string;
  componentType: string;
  useMagnitude: boolean | null;
  useAngle: boolean | null;
  component: any;
  firstSimulationId: number | null;
  secondSimulationId: number | null;
}
