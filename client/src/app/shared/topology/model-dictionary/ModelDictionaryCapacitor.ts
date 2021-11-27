/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ModelDictionaryCapacitor {
  name: string;
  mRID: string;
  CN1: string;
  phases: string;
  // eslint-disable-next-line camelcase
  kvar_A: number;
  // eslint-disable-next-line camelcase
  kvar_B: number;
  // eslint-disable-next-line camelcase
  kvar_C: number;
  nominalVoltage: number;
  nomU: number;
  phaseConnection: string;
  grounded: boolean;
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mode: any;
  targetValue: number;
  targetDeadband: number;
  aVRDelay: number;
  monitoredName: any;
  monitoredClass: any;
  monitoredBus: any;
  monitoredPhase: any;
}
