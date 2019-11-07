import * as React from 'react';

import { Authentication } from './Authentication';
import { AuthenticationService } from './services/AuthenticationService';
import { AuthenticationResult } from './models/AuthenticationResult';
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
    if (this._authenticationService.isAuthenticated())
      return {
        statusCode: AuthenticationStatusCode.OK
      };
    return {
      statusCode: AuthenticationStatusCode.UKNOWN
    };
  }

  componentDidMount() {
    this._authenticationService.sessionEnded()
      .subscribe({
        next: () => {
          this._logout();
        }
      });
  }

  private _logout() {
    this.setState({
      authenticationResult: {
        statusCode: AuthenticationStatusCode.UKNOWN
      }
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
