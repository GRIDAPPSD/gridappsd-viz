import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export class Store<T> {

  private static readonly _INSTANCE = new Store();

  private readonly _stateChange = new Subject<T>();

  private _state: T;

  private constructor() {
  }

  static getInstance<T>(): Store<T> {
    return Store._INSTANCE as Store<T>;
  }

  initialize(defaultState: T) {
    if (this._state)
      throw new Error('Store has been initialized');
    this._state = defaultState;
    this._stateChange.next(this._state);
  }

  mergeState(newState: { [K in keyof T]: T[K] }) {
    for (const key in newState)
      this._state[key] = newState[key];
    this._stateChange.next(this._state);
  }

  select<K extends keyof T>(selector: (state: T) => Readonly<T[K]>) {
    return this._stateChange.pipe(map(selector));
  }

}
