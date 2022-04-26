import { ModelDictionaryComponent } from '@client:common/topology';
export interface SimulationVsTimeSeriesRequestConfigModel {
  lineName: string | '';
  userSelectedSimulationId: number | null;
  componentType: string;
  useMagnitude: boolean | null;
  useAngle: boolean | null;
  component: ModelDictionaryComponent[];
  firstSimulationId: number | null;
}
