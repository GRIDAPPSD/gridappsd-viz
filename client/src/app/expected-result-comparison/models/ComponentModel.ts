export interface ComponentModel {
  id: string;
  name: string;
  conductingEquipmentname: string;
  conductingEquipmentType: string;
  displayName: string;
  phases: string[] | string | null;
  conductingEquipmentMRIDs: string[];
  type: string;
  measurementMRIDs: string[];
}
