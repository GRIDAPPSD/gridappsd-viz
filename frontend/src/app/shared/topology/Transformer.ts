import { Node } from './Node';

export interface Transformer extends Node {
  from: string;
  to: string;
  phases: string;
  configuration: string;
  x2: number;
  y2: number;
  mRID: string;
}
