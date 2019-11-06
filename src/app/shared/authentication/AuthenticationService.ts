import { User } from './User';
import { StompClientService } from '@shared/StompClientService';

export class AuthenticationService {

  private static readonly _INSTANCE = new AuthenticationService();

  private readonly _stompClientService = StompClientService.getInstance();

  private _currentUser: User;

  private constructor() {
    this.logout = this.logout.bind(this);
  }

  static getInstance() {
    return AuthenticationService._INSTANCE;
  }

  authenticate(username: string, password: string): Promise<User> {
    this._currentUser = new User(username);
    return this._stompClientService.connect(username, password)
      .then(() => {
        this._currentUser.isAuthenticated = true;
        sessionStorage.setItem('currentUser', JSON.stringify(this._currentUser));
        return this._currentUser;
      })
      .catch(() => this._currentUser);
  }

  findAuthenticatedUserInCurrentSession(): User {
    if (this._currentUser && this._currentUser.isAuthenticated)
      return this._currentUser;
    this._currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    return this._currentUser;
  }

  logout() {
    this._currentUser = null;
    sessionStorage.clear();
  }

}
