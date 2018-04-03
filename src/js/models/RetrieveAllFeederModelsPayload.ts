export interface RetrieveAllFeederModelsPayload {
  data: {
    head: {
      vars: Array<'name' | 'mRID' | 'substationName' | 'substationID' | 'subregionName' | 'subregionID' | 'regionName' | 'regionID'>;
    };
    results: {
      bindings: Array<{
        name: { type: string, value: string },
        mRID: { type: string, value: string },
        substationName: { type: string, value: string },
        substationID: { type: string, value: string },
        subregionName: { type: string, value: string },
        subregionID: { type: string, value: string },
        regionName: { type: string, value: string },
        regionID: { type: string, value: string }
      }>;
    }
  },
  id: string;
  responseComplete: boolean;
}