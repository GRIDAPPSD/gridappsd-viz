import { User } from '../models/User';
import { StompClientService, StompClientInitializationResult } from '@shared/StompClientService';
import { AuthenticationResult } from '../models/AuthenticationResult';
import { AuthenticationStatusCode } from '../models/AuthenticationStatusCode';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';

export class AuthenticationService {

  private static readonly _INSTANCE = new AuthenticationService();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _userSessionSubject = new Subject<void>();

  private _currentUser: User = null;

  private constructor() {
    this.logout = this.logout.bind(this);
  }

  static getInstance() {
    return AuthenticationService._INSTANCE;
  }

  authenticate(username: string, password: string): Promise<AuthenticationResult> {
    this._currentUser = new User(username);
    const authenticationResult: AuthenticationResult = {
      user: this._currentUser,
      statusCode: null
    };

    return this._stompClientService.connect(username, password)
      .then(() => {
        this._currentUser.isAuthenticated = true;
        sessionStorage.setItem('currentUser', JSON.stringify(this._currentUser));
        authenticationResult.statusCode = AuthenticationStatusCode.OK;
        return authenticationResult;
      })
      .catch(code => {
        if (code === StompClientInitializationResult.AUTHENTICATION_FAILURE)
          authenticationResult.statusCode = AuthenticationStatusCode.INCORRECT_CREDENTIALS;
        else
          authenticationResult.statusCode = AuthenticationStatusCode.SERVER_FAILURE;
        return authenticationResult;
      });
  }

  findAuthenticatedUserInCurrentSession(): User {
    if (this._currentUser && this._currentUser.isAuthenticated)
      return this._currentUser;
    this._currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    return this._currentUser;
  }

  isAuthenticated() {
    return this._currentUser && this._currentUser.isAuthenticated;
  }

  logout() {
    this._currentUser = null;
    sessionStorage.clear();
    this._userSessionSubject.next();
  }

  onSessionEnded() {
    return this._userSessionSubject.asObservable()
      .pipe(take(1));
  }

}
