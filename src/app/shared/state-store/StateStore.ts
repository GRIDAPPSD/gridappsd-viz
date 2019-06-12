import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApplicationState } from './ApplicationState';

export class StateStore {

  private static readonly _INSTANCE = new StateStore();

  private readonly _stateChange = new Subject<ApplicationState>();

  private _state: ApplicationState;

  private constructor() {
  }

  static getInstance(): StateStore {
    return StateStore._INSTANCE;
  }

  initialize(defaultState: ApplicationState) {
    if (this._state)
      throw new Error('Store has been initialized');
    this._state = defaultState;
    this._stateChange.next(this._state);
  }

  mergeState<K extends keyof ApplicationState>(newState: Pick<ApplicationState, K>) {
    for (const key in newState)
      this._state[key] = newState[key];
    this._stateChange.next(this._state);
  }

  select<K>(selector: (state: ApplicationState) => Readonly<K>) {
    return this._stateChange.pipe(map(selector));
  }

}
