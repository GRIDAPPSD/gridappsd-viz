import { SwingNode } from './SwingNode';
import { Transformer } from './Transformer';
import { Capacitor } from './Capacitor';
import { OverheadLine } from './OverheadLine';
import { Regulator } from './Regulator';
import { Switch } from './Switch';

export interface TopologyModel {
  feeders: Array<SwingNode | Transformer | Capacitor | OverheadLine | Regulator | Switch>;
}