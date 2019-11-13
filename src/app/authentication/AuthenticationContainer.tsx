import * as React from 'react';
import { Subscription } from 'rxjs';

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

  private _sessionSubscription: Subscription;

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
    this._sessionSubscription = this._authenticationService.sessionEnded()
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

  componentWillUnmount() {
    this._sessionSubscription.unsubscribe();
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
      .subscribe({
        next: authenticationResult => {
          this.setState({
            authenticationResult
          });
        },
        error: authenticationResult => {
          this.setState({
            authenticationResult
          });
        }
      });
  }

}
