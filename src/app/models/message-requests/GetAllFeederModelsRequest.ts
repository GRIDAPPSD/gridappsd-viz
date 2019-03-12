import { MessageRequest } from '@shared/MessageRequest';

export class GetAllFeederModelsRequest implements MessageRequest {
  readonly url = 'goss.gridappsd.process.request.data.powergridmodel';
  readonly replyTo = 'feeder-models';
  readonly requestBody = `{"requestType":"QUERY","resultFormat":"JSON","queryString":"SELECT ?name ?mRID ?substationName ?substationID ?subregionName ?subregionID ?regionName ?regionID WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?name.?s c:IdentifiedObject.mRID ?mRID.?s c:Feeder.NormalEnergizingSubstation ?subStation.?subStation c:IdentifiedObject.name ?substationName.?subStation c:IdentifiedObject.mRID ?substationID.?subStation c:Substation.Region ?subRegion.?subRegion c:IdentifiedObject.name ?subregionName.?subRegion c:IdentifiedObject.mRID ?subregionID.?subRegion c:SubGeographicalRegion.Region ?region.?region c:IdentifiedObject.name ?regionName.?region c:IdentifiedObject.mRID ?regionID.}  ORDER by ?name "}`;

}

export interface GetAllFeederModelsRequestPayload {
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