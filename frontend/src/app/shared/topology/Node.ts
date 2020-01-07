type NodeType = (
  'battery'
  | 'switch'
  | 'solarpanel'
  | 'swing_node'
  | 'transformer'
  | 'capacitor'
  | 'regulator'
  | 'unknown'
  | 'substation'
);

export interface Node {
  name: string;
  type: NodeType;
  x1: number;
  y1: number;
  screenX1: number;
  screenY1: number;
  mRIDs: string[];
}
