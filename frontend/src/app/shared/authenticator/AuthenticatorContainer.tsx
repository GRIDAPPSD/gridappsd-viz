import * as React from 'react';
import { Subscription } from 'rxjs';

import { Authenticator } from './Authenticator';
import { AuthenticatorService } from './services/AuthenticatorService';
import { AuthenticationResult } from './models/AuthenticationResult';
import { AuthenticationStatusCode } from './models/AuthenticationStatusCode';

interface Props {
}

interface State {
  authenticationResult: AuthenticationResult;
}

export class AuthenticatorContainer extends React.Component<Props, State> {

  private readonly _authenticatorService = AuthenticatorService.getInstance();

  private _sessionSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      authenticationResult: this._login()
    };

    this.tryLogin = this.tryLogin.bind(this);
  }

  private _login() {
    if (this._authenticatorService.isAuthenticated())
      return {
        statusCode: AuthenticationStatusCode.OK
      };
    return {
      statusCode: AuthenticationStatusCode.UKNOWN
    };
  }

  componentDidMount() {
    this._sessionSubscription = this._authenticatorService.sessionEnded()
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
      <Authenticator
        authenticationResult={this.state.authenticationResult}
        tryLogin={this.tryLogin}>
        {this.props.children}
      </Authenticator>
    );
  }

  tryLogin(username: string, password: string) {
    this._authenticatorService.authenticate(username, password)
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
