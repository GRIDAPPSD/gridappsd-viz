import { ModelDictionaryMeasurement } from './ModelDictionaryMeasurement';
import { ModelDictionaryCapacitor } from './ModelDictionaryCapacitor';
import { ModelDictionaryRegulator } from './ModelDictionaryRegulator';
import { ModelDictionarySwitch } from './ModelDictionarySwitch';

export interface ModelDictionary {
  name: string;
  mRID: string;
  substation: string;
  substationID: string;
  subregion: string;
  subregionID: string;
  region: string;
  regionID: string;
  synchronousmachines: any[];
  capacitors: ModelDictionaryCapacitor[];
  regulators: ModelDictionaryRegulator[];
  solarpanels: any[];
  batteries: any[];
  switches: ModelDictionarySwitch[];
  fuses: any[];
  sectionalisers: any[];
  breakers: any[];
  reclosers: any[];
  disconnectors: any[];
  measurements: ModelDictionaryMeasurement[];
}
