export interface SimulationVsExpectedRequestConfigModel {
  lineName: string | '';
  userSelectedSimulationId: number | null;
  componentType: string;
  useMagnitude: boolean | null;
  useAngle: boolean | null;
  component: any;
  firstSimulationId: number | null;
}
