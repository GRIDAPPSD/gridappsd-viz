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
  synchronousmachines: unknown[];
  capacitors: ModelDictionaryCapacitor[];
  regulators: ModelDictionaryRegulator[];
  solarpanels: unknown[];
  batteries: unknown[];
  switches: ModelDictionarySwitch[];
  fuses: unknown[];
  sectionalisers: unknown[];
  breakers: unknown[];
  reclosers: unknown[];
  disconnectors: unknown[];
  measurements: ModelDictionaryMeasurement[];
}
