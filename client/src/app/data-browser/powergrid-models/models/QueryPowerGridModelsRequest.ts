import { MessageRequest } from '@client:common/MessageRequest';


export class QueryPowerGridModelsRequest implements MessageRequest {

  private _requestBody: QueryPowerGridModelsRequestBody = {} as QueryPowerGridModelsRequestBody;

  get url() {
    return 'goss.gridappsd.process.request.data.powergridmodel';
  }

  get replyTo() {
    return 'query-powergrid-models';
  }

  get requestBody() {
    return this._requestBody;
  }

  set requestBody(value: QueryPowerGridModelsRequestBody) {
    this._requestBody = value;
  }

}

export const enum QueryPowerGridModelsRequestType {
  QUERY_MODEL_NAMES = 'QUERY_MODEL_NAMES',
  QUERY = 'QUERY',
  QUERY_OBJECT_TYPES = 'QUERY_OBJECT_TYPES',
  QUERY_OBJECT = 'QUERY_OBJECT',
  QUERY_MODEL = 'QUERY_MODEL'
}

export const enum QueryPowerGridModelsResultFormat {
  JSON = 'JSON',
  CSV = 'CSV'
}

export interface QueryPowerGridModelsRequestBody {
  requestType: QueryPowerGridModelsRequestType;
  resultFormat: QueryPowerGridModelsResultFormat;
  modelId?: string;
  queryString?: string;
  filter?: string;
  objectId?: string;
}
