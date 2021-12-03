import { MessageRequest } from '@client:common/MessageRequest';

export class GetAllFeederModelsRequest implements MessageRequest {
  readonly url = 'goss.gridappsd.process.request.data.powergridmodel';
  readonly replyTo = 'feeder-models';
  readonly requestBody = '{"requestType":"QUERY","resultFormat":"JSON","queryString":"SELECT ?name ?mRID ?substationName ?substationID ?subregionName ?subregionID ?regionName ?regionID WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?name.?s c:IdentifiedObject.mRID ?mRID.?s c:Feeder.NormalEnergizingSubstation ?subStation.?subStation c:IdentifiedObject.name ?substationName.?subStation c:IdentifiedObject.mRID ?substationID.?subStation c:Substation.Region ?subRegion.?subRegion c:IdentifiedObject.name ?subregionName.?subRegion c:IdentifiedObject.mRID ?subregionID.?subRegion c:SubGeographicalRegion.Region ?region.?region c:IdentifiedObject.name ?regionName.?region c:IdentifiedObject.mRID ?regionID.}  ORDER by ?name "}';

}


export interface GetFeederModelsResponsePayload {
  results: {
    bindings: Array<{
      name: {
        type: 'literal';
        value: string;
      };
      mRID: {
        type: 'literal';
        value: string;
      };
      substationName: {
        type: 'literal';
        value: string;
      };
      substationID: {
        type: 'literal';
        value: string;
      };
      subregionName: {
        type: 'literal';
        value: string;
      };
      subregionID: {
        type: 'literal';
        value: string;
      };
      regionName: {
        type: 'literal';
        value: string;
      };
      regionID: {
        type: 'literal';
        value: string;
      };
    }>;
  };
}
