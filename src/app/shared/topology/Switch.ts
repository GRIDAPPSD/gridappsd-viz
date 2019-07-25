import { Node } from './Node';

export interface Switch extends Node {
  from: string;
  to: string;
  open: boolean;
  phases: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  mRID: string;
}
