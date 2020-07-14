import { Phase } from '../Phase';

export interface FaultEvent {
  // eslint-disable-next-line camelcase
  event_type: 'Fault';
  tag: string;
  equipmentType: string;
  equipmentName: string;
  phases: Phase[];
  faultKind: FaultKind;
  mRID: string | string[];
  faultImpedance: FaultImpedance['LineToGround'] | FaultImpedance['LineToLine'] | FaultImpedance['LineToLineToGround'];
  // Epoch time with second precision
  startDateTime: number;
  stopDateTime: number;
}

export interface FaultImpedance {
  LineToGround: {
    rGround: string;
    xGround: string;
  };
  LineToLine: {
    rLineToLine: string;
    xLineToLine: string;
  };
  LineToLineToGround: {
    rGround: string;
    xGround: string;
    rLineToLine: string;
    xLineToLine: string;
  };
}

export const enum FaultKind {
  LINE_TO_GROUND = 'lineToGround',
  LINE_TO_LINE = 'lineToLine',
  LINE_TO_LINE_TO_GROUND = 'lineToLineToGround'
}

export const FaultImpedanceType = Object.freeze({
  lineToGround: ['rGround', 'xGround'],
  lineToLine: ['rLineToLine', 'xLineToLine'],
  lineToLineToGround: ['rGround', 'xGround', 'rLineToLine', 'xLineToLine']
});
