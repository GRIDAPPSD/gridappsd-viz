import { Subject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { StompClientService, StompClientInitializationResult } from '@shared/StompClientService';
import { AuthenticationResult } from '../models/AuthenticationResult';
import { AuthenticationStatusCode } from '../models/AuthenticationStatusCode';
import { waitUntil } from '@shared/misc';

export class AuthenticatorService {

  private static readonly _INSTANCE = new AuthenticatorService();

  private readonly _stompClientService = StompClientService.getInstance();
  private readonly _userSessionSubject = new Subject<void>();

  private _isAuthenticated = false;
  private _userRoles: string[];

  private constructor() {

    this._isAuthenticated = Boolean(sessionStorage.getItem('isAuthenticated'));
    this._userRoles = JSON.parse(sessionStorage.getItem('userRoles')) || [];

    this.logout = this.logout.bind(this);
    this.userHasRole = this.userHasRole.bind(this);
  }

  static getInstance() {
    return AuthenticatorService._INSTANCE;
  }

  authenticate(username: string, password: string): Observable<AuthenticationResult> {
    return this._stompClientService.connect(username, password)
      .pipe(
        tap(() => this._fetchUserRoles()),
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

  private _fetchUserRoles() {
    waitUntil(() => this._stompClientService.isActive())
      .then(() => {
        this._stompClientService.readOnceFrom('/user/roles')
          .pipe(
            map(JSON.parse as (body: string) => { data: { roles: string[] } }),
            map(payload => payload.data.roles)
          )
          .subscribe({
            next: userRoles => {
              this._userRoles = userRoles;
              sessionStorage.setItem('userRoles', JSON.stringify(userRoles));
            }
          });
        this._stompClientService.send(
          'goss.gridappsd.process.request.roles',
          {
            'reply-to': '/user/roles'
          },
          '{}'
        );
      });
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
  }

  sessionEnded() {
    return this._userSessionSubject.asObservable();
  }

}
