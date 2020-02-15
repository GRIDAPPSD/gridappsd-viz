import { FeederModelRegion, FeederModelSubregion, FeederModelLine } from '@shared/topology';

export interface PowerSystemConfigurationModel {
  region: FeederModelRegion;
  subregion: FeederModelSubregion;
  simulationName: string;
  line: FeederModelLine;
}
