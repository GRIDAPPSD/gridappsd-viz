import { Observable, BehaviorSubject } from 'rxjs';
import { ModelDictionary } from '@shared/topology';

export class ModelDictionaryTracker {

  private static readonly _INSTANCE = new ModelDictionaryTracker();

  private _tracker = new BehaviorSubject<ModelDictionary>(null);

  static getInstance() {
    return ModelDictionaryTracker._INSTANCE;
  }

  selectCurrentModelDictionary(newModelDictionary: ModelDictionary) {
    this._tracker.next(newModelDictionary);
  }

  changes(): Observable<ModelDictionary> {
    return this._tracker.asObservable();
  }

}