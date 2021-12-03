import { Node } from './Node';
import { RegulatorControlMode } from './RegulatorControlMode';

export interface Regulator extends Node {
  from: string;
  to: string;
  phases: string[];
  x2: number;
  y2: number;
  mRID: string[];
  manual: boolean;
  controlMode: RegulatorControlMode;
  phaseValues: {
    [phase: string]: {
      lineDropR: number;
      lineDropX: number;
      tap: number;
    };
  };
}
