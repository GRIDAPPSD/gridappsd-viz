import { Subject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { StompClientService, StompClientInitializationResult } from '@shared/StompClientService';
import { AuthenticationResult } from '../models/AuthenticationResult';
import { AuthenticationStatusCode } from '../models/AuthenticationStatusCode';

export class AuthenticationService {

  private static readonly _INSTANCE = new AuthenticationService();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _userSessionSubject = new Subject<void>();

  private _isAuthenticated = false;

  private constructor() {

    this._isAuthenticated = Boolean(sessionStorage.getItem('isAuthenticated'));

    this.logout = this.logout.bind(this);
  }

  static getInstance() {
    return AuthenticationService._INSTANCE;
  }

  authenticate(username: string, password: string): Observable<AuthenticationResult> {
    return this._stompClientService.connect(username, password)
      .pipe(
        map(() => {
          this._isAuthenticated = true;
          sessionStorage.setItem('isAuthenticated', 'true');
          return {
            statusCode: AuthenticationStatusCode.OK
          };
        }),
        catchError(code => {
          if (code === StompClientInitializationResult.AUTHENTICATION_FAILURE)
            return of({
              statusCode: AuthenticationStatusCode.INCORRECT_CREDENTIALS
            });
          return of({
            statusCode: AuthenticationStatusCode.SERVER_FAILURE
          });
        })
      );
  }

  isAuthenticated() {
    return this._isAuthenticated;
  }

  logout() {
    this._isAuthenticated = false;
    sessionStorage.clear();
    this._userSessionSubject.next();
  }

  sessionEnded() {
    return this._userSessionSubject.asObservable();
  }

}
