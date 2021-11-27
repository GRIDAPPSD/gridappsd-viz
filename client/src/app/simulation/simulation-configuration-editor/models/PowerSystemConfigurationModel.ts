import { FeederModelRegion, FeederModelSubregion, FeederModelLine } from '@client:common/topology';

export interface PowerSystemConfigurationModel {
  region: FeederModelRegion;
  subregion: FeederModelSubregion;
  simulationName: string;
  line: FeederModelLine;
}
