import { Node } from './Node';
export interface Capacitor extends Node {
  parent: string;
  phases: string;
  kvar_A: number;
  kvar_B: number;
  kvar_C: number;
  x1: number;
  y1: number;
  open: boolean;
  mRID: string;
  manual: boolean;
}