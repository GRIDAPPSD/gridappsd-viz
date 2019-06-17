import { BehaviorSubject, Observable } from 'rxjs';

import { ApplicationState } from './ApplicationState';

export class StateStore {

  private static readonly _INSTANCE = new StateStore();

  private readonly _stateChangeNotifiers = new Map<string, BehaviorSubject<any>>();

  private _isInitialized = false;

  private constructor() {
  }

  static getInstance(): StateStore {
    return StateStore._INSTANCE;
  }

  initialize(defaultState: ApplicationState) {
    if (this._isInitialized)
      throw new Error('Store has been initialized');
    for (const [key, value] of Object.entries(defaultState)) {
      const notifier = new BehaviorSubject<any>(value);
      this._stateChangeNotifiers.set(key, notifier);
      notifier.next(value);
    }
    this._isInitialized = true;
  }

  update<K extends keyof ApplicationState>(newState: Pick<ApplicationState, K>) {
    for (const key in newState)
      this._stateChangeNotifiers.get(key)
        .next(newState[key]);
  }

  select<K extends keyof ApplicationState>(key: K): Observable<ApplicationState[K]> {
    return this._stateChangeNotifiers.get(key)
      .asObservable();
  }

}
