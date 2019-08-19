import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';

import { User } from './User';
import { StateStore } from '@shared/state-store';

export class AuthenticationService {

  private static readonly _INSTANCE = new AuthenticationService();
  private readonly _stateStore = StateStore.getInstance();
  private _currentUser: User;

  private constructor() {
    this.logout = this.logout.bind(this);
  }

  static getInstance() {
    return AuthenticationService._INSTANCE;
  }

  authenticate(username: string, password: string): Observable<User> {
    this._currentUser = new User(username);
    if (username === 'system' && password === 'manager') {
      this._currentUser.isAuthenticated = true;
      sessionStorage.setItem('currentUser', JSON.stringify(this._currentUser));
      this._stateStore.update({
        currentUser: this._currentUser
      });
    }
    return of(this._currentUser).pipe(take(1));
  }

  findAuthenticatedUserInCurrentSession(): User {
    this._currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    this._stateStore.update({
      currentUser: this._currentUser
    });
    return this._currentUser;
  }

  logout() {
    this._currentUser = null;
    sessionStorage.removeItem('currentUser');
    this._stateStore.update({
      currentUser: this._currentUser
    });
  }

}
