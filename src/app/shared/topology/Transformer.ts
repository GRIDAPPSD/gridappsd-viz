import { Node } from './Node';

export interface Transformer extends Node {
  from: string;
  to: string;
  phases: string;
  configuration: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  mRID: string;
}