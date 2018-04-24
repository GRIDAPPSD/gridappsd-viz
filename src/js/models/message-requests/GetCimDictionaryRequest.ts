import { MessageRequest } from './MessageRequest';
import { RequestConfigurationType } from './RequestConfigurationType';

export interface GetCimDictionaryRequestBody {
  configurationType: string;
  parameters: {
    model_id: string;
  };
}

export class GetCimDictionaryRequest implements MessageRequest {
  private _requestBody: GetCimDictionaryRequestBody = null;

  constructor() {
    this._requestBody = {
      configurationType: RequestConfigurationType.CIM_DICTIONARY,
      parameters: {
        model_id: '_4F76A5F9-271D-9EB8-5E31-AA362D86F2C3'
      }
    };
  }
  get url(): string {
    return 'goss.gridappsd.process.request.config';
  }

  get replyTo() {
    return '/cim_dictionary/' + this.url;
  }

  get requestBody(): GetCimDictionaryRequestBody {
    return this._requestBody;
  }

  set requestBody(value: GetCimDictionaryRequestBody) {
    this._requestBody = value;
  }
}
