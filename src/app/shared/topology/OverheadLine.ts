import { Edge } from './Edge';

export interface OverheadLine extends Edge {
  phases: string;
  configuration: string;
  length: number;
  x1: number;
  y1: number;
  x2: number;
  y2: 0.0;
  mRID: string;
}