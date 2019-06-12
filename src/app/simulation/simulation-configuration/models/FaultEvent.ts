import { Phase } from './Phase';

export interface FaultEvent {
  type: 'Fault';
  tag: string;
  equipmentType: string;
  equipmentName: string;
  phases: Phase[];
  faultKind: FaultKind;
  mRID: any;
  impedance: {
    rGround: string;
    xGround: string;
    rLinetoLine: string;
    xLineToLine: string;
  };
  startDateTime: string;
  stopDateTime: string;
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
