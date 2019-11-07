import * as React from 'react';

import { NotificationBanner } from '@shared/notification-banner';
import { LoginScreen } from './views/login-screen/LoginScreen';
import { AuthenticationStatusCode } from './models/AuthenticationStatusCode';
import { AuthenticationResult } from './models/AuthenticationResult';

import './Authentication.light.scss';
import './Authentication.dark.scss';

interface Props {
  authenticationResult: AuthenticationResult;
  tryLogin: (username: string, password: string) => void;
}

interface State {
  showFailedLoginNofitification: boolean;
}

export class Authentication extends React.Component<Props, State> {

  private _failedLoginNotificationBannerAnimation: any;

  constructor(props: Props) {
    super(props);

    this.state = {
      showFailedLoginNofitification: false
    };

    this.tryLogin = this.tryLogin.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.authenticationResult !== prevProps.authenticationResult &&
      this.props.authenticationResult.statusCode !== AuthenticationStatusCode.OK
    ) {
      this.setState({
        showFailedLoginNofitification: true
      });
      this._failedLoginNotificationBannerAnimation = setTimeout(() => {
        this.setState({
          showFailedLoginNofitification: false
        });
      }, 5000);
    }
  }

  render() {
    switch (this.props.authenticationResult.statusCode) {
      case AuthenticationStatusCode.OK:
        return this.props.children;

      case AuthenticationStatusCode.INCORRECT_CREDENTIALS:
        return (
          <>
            <LoginScreen onLogin={this.tryLogin} />
            <NotificationBanner show={this.state.showFailedLoginNofitification}>
              Incorrect username or password
            </NotificationBanner>
          </>
        );

      case AuthenticationStatusCode.SERVER_FAILURE:
        return (
          <>
            <LoginScreen onLogin={this.tryLogin} />
            <NotificationBanner show={this.state.showFailedLoginNofitification}>
              There was a problem contacting the server
            </NotificationBanner>
          </>
        );

      default:
        return (
          <LoginScreen onLogin={this.tryLogin} />
        );
    }
  }

  tryLogin(username: string, password: string) {
    this.props.tryLogin(username, password);
    this._abortAnimatingFailedLoginNotificationBanner();
  }

  private _abortAnimatingFailedLoginNotificationBanner() {
    clearTimeout(this._failedLoginNotificationBannerAnimation);
    this.setState({
      showFailedLoginNofitification: false
    });
  }

}
