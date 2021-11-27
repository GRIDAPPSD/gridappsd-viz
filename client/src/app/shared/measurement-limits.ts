export interface CurrentLimit {
  id: string;
  Normal: number;
  Emergency: number;
}

export interface VoltageLimit {
  id: string;
  Blo: number;
  Alo: number;
  Ahi: number;
  Bhi: number;
  ConnectivityNode: string;
  x: number;
  y: number;
}
