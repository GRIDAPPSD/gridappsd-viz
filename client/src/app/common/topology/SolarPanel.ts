import { Node } from './Node';

export interface SolarPanel extends Node {
  parent: string;
  phases: string;
  kva: number;
}
