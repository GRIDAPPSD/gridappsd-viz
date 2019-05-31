export interface FaultEvent {
  type: 'Fault';
  id: string;
  equipmentType: string;
  equipmentName: string;
  phase: string;
  faultKind: FaultKind;
  lineToGround: string;
  lineToLine: string;
  lineToLineToGround: string;
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
