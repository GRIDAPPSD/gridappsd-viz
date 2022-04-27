import { ModelDictionaryComponent } from '@client:common/topology';
export interface TimeSeriesVsTimeSeriesRequestConfigModel {
  lineName: string;
  componentType: string;
  useMagnitude: boolean | null;
  useAngle: boolean | null;
  component: ModelDictionaryComponent[];
  firstSimulationId: number | null;
  secondSimulationId: number | null;
}
