import { MessageRequest, RequestConfigurationType } from '@shared/MessageRequest';
import { ModelDictionary } from '@shared/topology';

export interface GetModelDictionaryRequestBody {
  configurationType: string;
  parameters: {
    model_id: string;
  };
}

export class GetModelDictionaryRequest implements MessageRequest {
  readonly url = 'goss.gridappsd.process.request.config';
  readonly replyTo = 'model_dictionary';

  private _requestBody: GetModelDictionaryRequestBody = null;

  constructor() {
    this._requestBody = {
      configurationType: RequestConfigurationType.CIM_DICTIONARY,
      parameters: {
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
  data: {
    feeders: ModelDictionary[];
  };
}
