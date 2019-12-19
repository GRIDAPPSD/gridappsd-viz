export interface ModelDictionaryCapacitor {
  name: string;
  mRID: string;
  CN1: string;
  phases: string;
  kvar_A: number;
  kvar_B: number;
  kvar_C: number;
  nominalVoltage: number;
  nomU: number;
  phaseConnection: string;
  grounded: boolean;
  enabled: boolean;
  mode: any;
  targetValue: number;
  targetDeadband: number;
  aVRDelay: number;
  monitoredName: any;
  monitoredClass: any;
  monitoredBus: any;
  monitoredPhase: any;
}
