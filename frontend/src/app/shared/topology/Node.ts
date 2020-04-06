export const enum NodeType {
  SWITCH = 'switch',
  CAPACITOR = 'capacitor',
  TRANSFORMER = 'transformer',
  REGULATOR = 'regulator',
  SUBSTATION = 'substation',
  SOLAR_PANEL = 'solar-panel',
  SWING_NODE = 'swing-node',
  BATTERY = 'battery',
  UNKNOWN = 'unknown'
}

export interface Node {
  name: string;
  type: NodeType;
  x1: number;
  y1: number;
  screenX1: number;
  screenY1: number;
  mRIDs: string[];
}
