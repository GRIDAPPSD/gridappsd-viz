import { MessageRequest } from './MessageRequest';
import { RequestConfigurationType } from './RequestConfigurationType';

export interface GetModelDictionaryRequestBody {
  configurationType: string;
  parameters: {
    model_id: string;
  };
}

export class GetModelDictionaryRequest implements MessageRequest {
  private _requestBody: GetModelDictionaryRequestBody = null;
  private _simulationName = ''

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
    return '/model_dictionary/' + this.url;
  }

  get requestBody(): GetModelDictionaryRequestBody {
    return this._requestBody;
  }

  set requestBody(value: GetModelDictionaryRequestBody) {
    this._requestBody = value;
  }

  get simulationName() {
    return this._simulationName;
  }

  set simulationName(value: string) {
    this._simulationName = value;
  }
}
