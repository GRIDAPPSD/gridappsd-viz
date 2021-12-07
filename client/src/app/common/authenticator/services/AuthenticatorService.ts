import { Subject, Observable, of } from 'rxjs';
import { map, catchError, filter } from 'rxjs/operators';

import { StompClientService, StompClientInitializationStatus, StompClientConnectionStatus } from '@client:common/StompClientService';

import { AuthenticationResult } from '../models/AuthenticationResult';
import { AuthenticationStatusCode } from '../models/AuthenticationStatusCode';

export class AuthenticatorService {

  private static readonly _INSTANCE_ = new AuthenticatorService();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _userSessionSubject = new Subject<void>();

  private _isAuthenticated = false;
  private _userRoles: string[];

  private constructor() {

    this._isAuthenticated = Boolean(sessionStorage.getItem('isAuthenticated'));
    this._userRoles = JSON.parse(sessionStorage.getItem('userRoles') || '[]');
    this._watchForStompClientDisconnection();

    this.logout = this.logout.bind(this);
    this.userHasRole = this.userHasRole.bind(this);
  }

  private _watchForStompClientDisconnection() {
    this._stompClientService.statusChanges()
      .pipe(filter(status => status === StompClientConnectionStatus.DISCONNECTED))
      .subscribe({
        next: () => {
          this.logout();
        }
      });
  }

  static getInstance() {
    return AuthenticatorService._INSTANCE_;
  }

  static decodePayloadFromAuthenticationToken(token: string) {
    if (token.includes('.')) {
      return JSON.parse(atob(token.split('.')[1])) as {
        sub: string; // username
        nbf?: number;
        iss?: string;
        exp?: number;
        iat?: number;
        jti?: string;
        roles: string[];
      };
    }
    return {
      sub: token,
      roles: [] as string[]
    };
  }

  authenticate(username: string, password: string): Observable<AuthenticationResult> {
    return this._stompClientService.connect(username, password)
      .pipe(
        map(initializationResult => {
          this._isAuthenticated = true;
          this._userRoles = AuthenticatorService.decodePayloadFromAuthenticationToken(initializationResult.token).roles;
          sessionStorage.setItem('isAuthenticated', 'true');
          sessionStorage.setItem('userRoles', JSON.stringify(this._userRoles));
          return {
            statusCode: AuthenticationStatusCode.OK
          };
        }),
        catchError(error => {
          if (error.status === StompClientInitializationStatus.AUTHENTICATION_FAILURE) {
            return of({
              statusCode: AuthenticationStatusCode.INCORRECT_CREDENTIALS
            });
          }
          return of({
            statusCode: AuthenticationStatusCode.SERVER_FAILURE
          });
        })
      );
  }

  userHasRole(role: string) {
    return this._userRoles.includes(role);
  }

  isAuthenticated() {
    return this._isAuthenticated;
  }

  logout() {
    this._isAuthenticated = false;
    sessionStorage.clear();
    this._userSessionSubject.next();
    location.reload();
  }

  sessionEnded() {
    return this._userSessionSubject.asObservable();
  }

}
