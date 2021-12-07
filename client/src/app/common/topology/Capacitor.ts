/* eslint-disable camelcase */
import { Node } from './Node';
import { CapacitorControlMode } from './CapacitorControlMode';

export interface Capacitor extends Node {
  parent: string;
  phases: string;
  kvar_A: number;
  kvar_B: number;
  kvar_C: number;
  mRID: string;
  controlMode: CapacitorControlMode;
  open: boolean;
  manual: boolean;
  volt: {
    target: number;
    deadband: number;
  };
  var: {
    target: number;
    deadband: number;
  };
}
