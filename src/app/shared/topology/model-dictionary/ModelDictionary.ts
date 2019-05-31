import { ModelDictionaryMeasurement } from './ModelDictionaryMeasurement';

export interface ModelDictionary {
  name: string;
  mRID: string;
  substation: string;
  substationID: string;
  subregion: string;
  subregionID: string;
  region: string;
  regionID: string;
  capacitors: any[];
  regulators: any[];
  solarpanels: any[];
  batteries: any[];
  switches: any[];
  fuses: any[];
  disconnectors: any[];
  measurements: ModelDictionaryMeasurement[];
}
