import { ModelDictionary } from '@client:common/topology';
import { MessageRequest } from '@client:common/MessageRequest';

export interface GetModelDictionaryRequestBody {
  configurationType: string;
  parameters: {
    // eslint-disable-next-line camelcase
    model_id: string;
  };
}

export class GetModelDictionaryRequest implements MessageRequest {
  readonly url = 'goss.gridappsd.process.request.config';
  readonly replyTo = 'model_dictionary';

  private _requestBody: GetModelDictionaryRequestBody = null;

  constructor() {
    this._requestBody = {
      configurationType: 'CIM Dictionary',
      parameters: {
        // eslint-disable-next-line camelcase
        model_id: '_4F76A5F9-271D-9EB8-5E31-AA362D86F2C3'
      }
    };
  }

  get requestBody(): GetModelDictionaryRequestBody {
    return this._requestBody;
  }

  set requestBody(value: GetModelDictionaryRequestBody) {
    this._requestBody = value;
  }

}

export interface GetModelDictionaryResponsePayload {
  feeders: ModelDictionary[];
}
