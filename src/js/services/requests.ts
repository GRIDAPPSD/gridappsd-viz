interface MessageRequest {
  url: string;
  requestBody: any;
}

export class GetAllFeederModelsRequest implements MessageRequest {
  get url(): string {
    return 'goss.gridappsd.process.request.data.powergridmodel';
  }

  get requestBody(): string {
    return `{"requestType":"QUERY","resultFormat":"JSON","queryString":"SELECT ?name ?mRID ?substationName ?substationID ?subregionName ?subregionID ?regionName ?regionID WHERE {?s r:type c:Feeder.?s c:IdentifiedObject.name ?name.?s c:IdentifiedObject.mRID ?mRID.?s c:Feeder.NormalEnergizingSubstation ?subStation.?subStation c:IdentifiedObject.name ?substationName.?subStation c:IdentifiedObject.mRID ?substationID.?subStation c:Substation.Region ?subRegion.?subRegion c:IdentifiedObject.name ?subregionName.?subRegion c:IdentifiedObject.mRID ?subregionID.?subRegion c:SubGeographicalRegion.Region ?region.?region c:IdentifiedObject.name ?regionName.?region c:IdentifiedObject.mRID ?regionID.}  ORDER by ?name "}`;
  }
}

interface GetTopologyModelRequestBody {
  configurationType: string;
  parameters: {
    model_id: string;
  };
}
export class GetTopologyModelRequest implements MessageRequest {
  private _requestBody: GetTopologyModelRequestBody = null;

  constructor() {
    this._requestBody = {
      configurationType: 'GridLAB-D Symbols',
      parameters: {
        model_id: '_4F76A5F9-271D-9EB8-5E31-AA362D86F2C3'
      }
    };
  }
  get url(): string {
    return 'goss.gridappsd.process.request.config';
  }

  get requestBody(): GetTopologyModelRequestBody {
    return this._requestBody;
  }

  set requestBody(value: GetTopologyModelRequestBody) {
    this._requestBody = value;
  }
}