import { ModelDictionaryMeasurementType } from './ModelDictionaryComponentType';

export interface ModelDictionaryMeasurement {
  name: string;
  mRID: string;
  ConductingEquipment_mRID: string;
  Terminal_mRID: string;
  measurementType: ModelDictionaryMeasurementType;
  phases: string;
  MeasurementClass: string;
  ConductingEquipment_type: string;
  ConductingEquipment_name: string;
  ConnectivityNode: string;
}
