import { ConductingEquipmentType, MeasurementType } from '@client:common/topology/model-dictionary';

export interface FieldModelOutputMeasurement {
    mRID: string;
    name: string;
    type: MeasurementType;
    magnitude: number;
    angle: number;
    value?: number;
    conductingEquipmentName: string;
    conductingEquipmentType: ConductingEquipmentType;
    connectivityNode: string;
    conductingEquipmentMRID: string;
    phases: string;
}
