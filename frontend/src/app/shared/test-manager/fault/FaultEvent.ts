import { Phase } from '../Phase';

export interface FaultEvent {
  // snake case due to requirement
  event_type: 'Fault';
  tag: string;
  equipmentType: string;
  equipmentName: string;
  phases: Phase[];
  faultKind: FaultKind;
  mRID: any;
  FaultImpedance: {
    rGround: string;
    xGround: string;
    rLinetoLine: string;
    xLineToLine: string;
  };
  // Epoch time with second precision
  startDateTime: number;
  stopDateTime: number;
}

export const enum FaultKind {
  LINE_TO_GROUND = 'lineToGround',
  LINE_TO_LINE = 'lineToLine',
  LINE_TO_LINE_TO_GROUND = 'lineToLineToGround'
}

export const FaultImpedence = Object.freeze({
  lineToGround: ['rGround', 'xGround'],
  lineToLine: ['rLinetoLine', 'xLineToLine'],
  lineToLineToGround: ['rGround', 'xGround', 'rLinetoLine', 'xLineToLine']
});
