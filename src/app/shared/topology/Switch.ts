import { Node } from './Node';

export interface Switch extends Node {
  from: string;
  to: string;
  open: boolean;
  phases: string;
  x2: number;
  y2: number;
  screenX2: number;
  screenY2: number;
  dx: number;
  dy: number;
  colorWhenOpen: '#4aff4a';
  colorWhenClosed: '#f00';
}
