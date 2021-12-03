/* eslint-disable camelcase */
import { SwingNode } from './SwingNode';
import { Transformer } from './Transformer';
import { Capacitor } from './Capacitor';
import { OverheadLine } from './OverheadLine';
import { Regulator } from './Regulator';
import { Switch } from './Switch';
import { SolarPanel } from './SolarPanel';
import { Battery } from './Battery';
import { Fuse } from './Fuse';
import { Disconnector } from './Disconnector';
import { Breaker } from './Breaker';
import { Sectionaliser } from './Sectionaliser';
import { SynchronousMachine } from './SynchronousMachine';
import { Recloser } from './Recloser';

export interface TopologyModel {
  feeders: Array<{
    name: string;
    mRID: string;
    substation: string;
    substationID: string;
    subregion: string;
    subregionID: string;
    region: string;
    regionID: string;
    synchronousmachines: SynchronousMachine[];
    capacitors: Capacitor[];
    regulators: Regulator[];
    solarpanels: SolarPanel[];
    batteries: Battery[];
    switches: Switch[];
    fuses: Fuse[];
    sectionalisers: Sectionaliser[];
    breakers: Breaker[];
    reclosers: Recloser[];
    disconnectors: Disconnector[];
    swing_nodes: SwingNode[];
    transformers: Transformer[];
    overhead_lines: OverheadLine[];
    measurements: Array<{ [key: string]: string }>;
  }>;
}
