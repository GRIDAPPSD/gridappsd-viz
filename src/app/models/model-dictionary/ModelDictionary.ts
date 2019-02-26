import { ModelDictionaryMeasurement } from './ModelDictionaryMeasurement';
import { Regulator, SolarPanel, Battery, Switch, Fuse, Disconnector, Capacitor } from '@shared/topology';

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
      capacitors: Capacitor[];
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