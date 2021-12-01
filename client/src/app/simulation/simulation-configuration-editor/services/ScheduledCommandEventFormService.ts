import { StompClientService } from '@client:common/StompClientService';

export class ScheduledCommandEventFormService {

  private static readonly _INSTANCE_ = new ScheduledCommandEventFormService();

  private readonly _stompClientService = StompClientService.getInstance();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
  }

  static getInstance() {
    return ScheduledCommandEventFormService._INSTANCE_;
  }

  fetchAttributes(objectId: string, modelId: string, objectType: string) {
    return new Promise<string[]>((resolve, reject) => {
      const responseTopic = '/queue/object-dictionary';

      this._stompClientService.readOnceFrom<Array<{ [key: string]: string }>>(responseTopic)
        .subscribe({
          next: objectDictionaries => {
            const attributeSet = new Set<string>();
            const numberRegex = /^(?:-?\d+\.?\d*)?$/;

            for (const objectDictionary of objectDictionaries) {
              for (const [attribute, value] of Object.entries(objectDictionary)) {
                if (numberRegex.test(value)) {
                  attributeSet.add(attribute);
                }
              }
            }
            resolve([...attributeSet]);
          },
          error: reject
        });
      this._stompClientService.send({
        destination: 'goss.gridappsd.process.request.data.powergridmodel',
        replyTo: responseTopic,
        body: JSON.stringify({
          modelId,
          requestType: 'QUERY_OBJECT_DICT',
          resultFormat: 'JSON',
          objectType,
          objectId
        })
      });
    });
  }

}
