import { BehaviorSubject, Observable } from 'rxjs';

import { ApplicationState } from './ApplicationState';

export class StateStore {

  private static readonly _INSTANCE_ = new StateStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _stateChangeNotifiers = new Map<string, BehaviorSubject<unknown>>();

  private _isInitialized = false;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
  }

  static getInstance(): StateStore {
    return StateStore._INSTANCE_;
  }

  initialize(defaultState: ApplicationState) {
    if (this._isInitialized) {
      throw new Error('Store has been initialized');
    }
    for (const [key, value] of Object.entries(defaultState)) {
      const notifier = new BehaviorSubject<unknown>(value);
      this._stateChangeNotifiers.set(key, notifier);
      notifier.next(value);
    }
    this._isInitialized = true;
  }

  update<K extends keyof ApplicationState>(newState: Pick<ApplicationState, K>) {
    for (const [k, v] of Object.entries(newState)) {
      this._stateChangeNotifiers.get(k).next(v);
    }
  }

  select<K extends keyof ApplicationState>(key: K): Observable<ApplicationState[K]> {
    return this._stateChangeNotifiers.get(key).asObservable() as Observable<ApplicationState[K]>;
  }

  toJson() {
    const json = {};
    this._stateChangeNotifiers.forEach((notifier, key) => {
      json[key] = notifier.value;
    });
    return json;
  }

}
