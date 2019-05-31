import { MRID } from '../MRID';

export interface FeederModel {
  regions: Array<{ regionName: string; regionID: string; index: number }>;
  subregions: Array<{ subregionName: string; subregionID: string; index: number }>;
  lines: Array<{ name: string; mRID: string; index: number }>;
  mRIDs: MRID[];
}