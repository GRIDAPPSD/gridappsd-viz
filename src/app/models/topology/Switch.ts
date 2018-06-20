export interface Switch {
  type: string;
  from: string;
  to: string;
  name: string;
  open: 'true' | 'false';
  phases: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}