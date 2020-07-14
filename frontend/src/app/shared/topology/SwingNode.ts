import { Node } from './Node';

export interface SwingNode extends Node {
  bus: string;
  phases: string;
  // eslint-disable-next-line camelcase
  nominal_voltage: number;
  x1: number;
  y1: number;
  mRID: string;
}
