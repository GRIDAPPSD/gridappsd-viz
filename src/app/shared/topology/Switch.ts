import { Node } from './Node';

export interface Switch extends Node {
  type: 'switch';
  from: string;
  to: string;
  open: boolean;
  phases: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  mRID: string;
  screenX1: number;
  screenY1: number;
  screenX2: number;
  screenY2: number;
  dx: number;
  dy: number;
  colorWhenOpen: '#4aff4a';
  colorWhenClosed: '#f00';
}
