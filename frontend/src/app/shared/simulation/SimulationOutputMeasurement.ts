import { ConductingEquipmentType, MeasurementType } from '@shared/topology/model-dictionary';

export interface SimulationOutputMeasurement {
  magnitude: number;
  angle: number;
  mRID: string;
  value: number;
  phases: string;
  conductingEquipmentName: string;
  conductingEquipmentType: ConductingEquipmentType;
  connectivityNode: string;
  name: string;
  type: MeasurementType;
  conductingEquipmentMRID: string;
}
