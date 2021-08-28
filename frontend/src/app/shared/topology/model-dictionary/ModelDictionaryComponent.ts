import { MeasurementType } from './MeasurementType';
import { ConductingEquipmentType } from './ConductingEquipmentType';

/**
 *
 * Each instance of this interface represents a component
 * referred to by each measurement inside the "measurements" array
 * in a model dictionary. Because the same component can appear
 * multiple times with different phases inside the measurements array
 * in a model dictionary, we use this to consolidate them all into
 * one instance with the different phases grouped together to faciliate
 * displaying in components dropdowns in test config and plot creation for simulation
 *
 * @see ModelDictionaryMeasurement
 **/
export interface ModelDictionaryComponent {
  conductingEquipmentName: string;
  conductingEquipmentType: ConductingEquipmentType;
  phases: string[];
  displayName: string;
  id: string;
  conductingEquipmentMRIDs: string[];
  type: MeasurementType;
  name: string;
  measurementMRIDs: string[];
}
