import { Component } from 'react';
import { Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Authenticator } from './Authenticator';
import { AuthenticatorService } from './services/AuthenticatorService';
import { AuthenticationStatusCode } from './models/AuthenticationStatusCode';
import { AuthenticationResult } from './models/AuthenticationResult';

interface Props {
}

interface State {
  authenticationResult: AuthenticationResult;
}

export class AuthenticatorContainer extends Component<Props, State> {

  private readonly _authenticatorService = AuthenticatorService.getInstance();

  private _sessionSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      authenticationResult: {
        statusCode: this._authenticatorService.isAuthenticated()
          ? AuthenticationStatusCode.OK
          : AuthenticationStatusCode.UKNOWN
      }
    };

    this.tryLogin = this.tryLogin.bind(this);
  }

  componentDidMount() {
    this._sessionSubscription = this._authenticatorService.sessionEnded()
      .subscribe({
        next: () => {
          this.setState({
            authenticationResult: {
              statusCode: AuthenticationStatusCode.UKNOWN
            }
          });
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
    return this._authenticatorService.authenticate(username, password)
      .pipe(
        tap(authenticationResult => {
          this.setState({
            authenticationResult
          });
        })
      );
  }

}
