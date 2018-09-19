import { Regulator } from '../topology/Regulator';
import { Switch } from '../topology/Switch';
import { SolarPanel } from '../topology/SolarPanel';
import { Battery } from '../topology/Battery';
import { Fuse } from '../topology/Fuse';
import { Disconnector } from '../topology/Disconnector';
import { ModelDictionaryMeasurement } from './ModelDictionaryMeasurement';

export interface ModelDictionary {
  data: {
    feeders: Array<{
      name: string;
      mRID: string;
      substation: string;
      substationID: string;
      subregion: string;
      subregionID: string;
      region: string;
      regionID: string;
      capacitors: string;
      regulators: Regulator[];
      solarpanels: SolarPanel[];
      batteries: Battery[];
      switches: Switch[];
      fuses: Fuse[];
      disconnectors: Disconnector[];
      measurements: ModelDictionaryMeasurement[];
    }>;
  }
}