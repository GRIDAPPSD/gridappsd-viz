import * as React from 'react';

import { Authentication } from './Authentication';
import { AuthenticationResult } from './models/AuthenticationResult';
import { AuthenticationService } from './services/AuthenticationService';
import { AuthenticationStatusCode } from './models/AuthenticationStatusCode';

interface Props {
}

interface State {
  authenticationResult: AuthenticationResult;
}

export class AuthenticationContainer extends React.Component<Props, State> {

  private readonly _authenticationService = AuthenticationService.getInstance();

  constructor(props: Props) {
    super(props);

    this.state = {
      authenticationResult: this._login()
    };

    this.tryLogin = this.tryLogin.bind(this);
  }

  private _login() {
    const currentUserInSession = this._authenticationService.findAuthenticatedUserInCurrentSession();
    if (currentUserInSession)
      return {
        user: currentUserInSession,
        statusCode: this._authenticationService.isAuthenticated()
          ? AuthenticationStatusCode.OK
          : AuthenticationStatusCode.INCORRECT_CREDENTIALS
      };
    return null;
  }

  componentDidMount() {
    this._authenticationService.onSessionEnded()
      .subscribe({
        next: () => {
          this._logout();
        }
      });
  }

  private _logout() {
    this.setState({
      authenticationResult: null
    });
  }

  render() {
    return (
      <Authentication
        authenticationResult={this.state.authenticationResult}
        tryLogin={this.tryLogin}>
        {this.props.children}
      </Authentication>
    );
  }

  tryLogin(username: string, password: string) {
    this._authenticationService.authenticate(username, password)
      .then(authenticationResult => {
        this.setState({
          authenticationResult
        });
      });
  }

}
