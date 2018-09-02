export interface Node {
  name: string;
  type: 'battery' | 'switch' | 'solarpanel' | 'swing_node' | 'transformer' | 'capacitor' | 'regulator' | 'node';
  // Original data
  data: any;
  // Original x coordinate from the data
  x: number;
  y: number;
  screenX: number;
  screenY: number;
}

const groupNames = ['batteries', 'switches', 'solarpanels', 'swing_nodes', 'transformers', 'overhead_lines',
  'capacitors', 'regulators'
];
