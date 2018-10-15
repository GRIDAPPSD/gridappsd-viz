import { MessageRequest } from './MessageRequest';


export class QueryBlazeGraphRequest implements MessageRequest {
  private _requestBody: QueryBlazeGraphRequestBody = {} as QueryBlazeGraphRequestBody;

  get url() {
    return 'goss.gridappsd.process.request.data.powergridmodel';
  }

  get replyTo() {
    return 'query-blazegraph';
  }

  get requestBody() {
    return this._requestBody;
  }

  set requestBody(value: QueryBlazeGraphRequestBody) {
    this._requestBody = value;
  }

}

export const enum QueryBlazeGraphRequestType {
  QUERY_MODEL_NAMES = 'QUERY_MODEL_NAMES',
  QUERY = 'QUERY',
  QUERY_OBJECT_TYPES = 'QUERY_OBJECT_TYPES',
  QUERY_OBJECT = 'QUERY_OBJECT',
  QUERY_MODEL = 'QUERY_MODEL'
}

export const enum QueryBlazeGraphRequestResultFormat {
  JSON = 'JSON',
  CSV = 'CSV'
}
export interface QueryBlazeGraphRequestBody {
  requestType: QueryBlazeGraphRequestType;
  resultFormat: QueryBlazeGraphRequestResultFormat;
  modelId?: string;
  queryString?: string;
  filter?: string;
  objectId?: string;
}