import { Node } from './Node';

export interface Regulator extends Node {
  from: string;
  to: string;
  phases: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mRID: string;
}