export interface Node {
  name: string;
  type: 'battery' | 'switch' | 'solarpanel' | 'swing_node' | 'transformer' | 'capacitor' | 'regulator' | 'unknown';
  x: number;
  y: number;
  screenX: number;
  screenY: number;
}