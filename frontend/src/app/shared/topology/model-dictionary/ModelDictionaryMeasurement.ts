/* eslint-disable camelcase */
import { MeasurementType } from './MeasurementType';

export interface ModelDictionaryMeasurement {
  name: string;
  mRID: string;
  ConductingEquipment_mRID: string;
  Terminal_mRID: string;
  measurementType: MeasurementType;
  phases: string;
  MeasurementClass: string;
  ConductingEquipment_type: string;
  ConductingEquipment_name: string;
  ConnectivityNode: string;
}
