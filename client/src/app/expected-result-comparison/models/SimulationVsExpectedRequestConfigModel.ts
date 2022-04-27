import { ModelDictionaryComponent } from '@client:common/topology';
export interface SimulationVsExpectedRequestConfigModel {
  lineName: string | '';
  userSelectedSimulationId: number | null;
  componentType: string;
  useMagnitude: boolean | null;
  useAngle: boolean | null;
  component: ModelDictionaryComponent[];
}
