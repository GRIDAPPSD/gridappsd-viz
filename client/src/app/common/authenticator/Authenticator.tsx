import { Observable } from 'rxjs';
import { Component } from 'react';

import { Notification } from '@client:common/overlay/notification';

import { LoginScreen } from './views/login-screen/LoginScreen';
import { AuthenticationStatusCode } from './models/AuthenticationStatusCode';
import { AuthenticationResult } from './models/AuthenticationResult';

interface Props {
  authenticationResult: AuthenticationResult;
  tryLogin: (username: string, password: string) => Observable<AuthenticationResult>;
}

interface State {
}

export class Authenticator extends Component<Props, State> {

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.authenticationResult !== prevProps.authenticationResult &&
      this.props.authenticationResult.statusCode !== AuthenticationStatusCode.OK
    ) {
      switch (this.props.authenticationResult.statusCode) {
        case AuthenticationStatusCode.INCORRECT_CREDENTIALS:
          Notification.open('Incorrect username or password');
          break;

        case AuthenticationStatusCode.SERVER_FAILURE:
          Notification.open('There was a problem contacting the server');
          break;
      }
    }
  }

  render() {
    if (this.props.authenticationResult.statusCode === AuthenticationStatusCode.OK) {
      return this.props.children;
    }
    return (
      <LoginScreen onLogin={this.props.tryLogin} />
    );
  }

}
