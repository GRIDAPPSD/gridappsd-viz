import { Node } from './Node';
import { CapacitorControlMode } from 'app/topology-renderer/models/CapacitorControlMode';
export interface Capacitor extends Node {
  parent: string;
  phases: string;
  kvar_A: number;
  kvar_B: number;
  kvar_C: number;
  x1: number;
  y1: number;
  mRID: string;
  controlMode: CapacitorControlMode;
  open: boolean;
  manual: boolean;
  volt: {
    target: string;
    deadband: string;
  };
  var: {
    target: string;
    deadband: string;
  };
}
