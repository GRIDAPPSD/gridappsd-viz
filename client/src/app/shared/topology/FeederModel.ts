export interface FeederModel {
  [regionId: string]: FeederModelRegion;
}

export interface FeederModelRegion {
  id: string;
  name: string;
  subregions: FeederModelSubregion[];
  lines: FeederModelLine[];
}

export interface FeederModelSubregion {
  id: string;
  name: string;
}

export interface FeederModelLine {
  name: string;
  id: string;
  subregionId: string;
}
