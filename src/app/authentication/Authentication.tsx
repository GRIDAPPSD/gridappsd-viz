import * as React from 'react';

import { User } from '@shared/authentication';
import { LoginScreen } from './views/login-screen/LoginScreen';

import './Authentication.light.scss';
import './Authentication.dark.scss';
import { NotificationBanner } from '@shared/notification-banner';

interface Props {
  authenticatingUser: User;
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
      this.props.authenticatingUser &&
      this.props.authenticatingUser !== prevProps.authenticatingUser &&
      !this.props.authenticatingUser.isAuthenticated
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
    if (this.props.authenticatingUser && this.props.authenticatingUser.isAuthenticated)
      return this.props.children;
    return (
      <>
        <LoginScreen
          authenticatingUser={this.props.authenticatingUser}
          onLogin={this.tryLogin} />
        <NotificationBanner show={this.state.showFailedLoginNofitification}>
          Incorrect username or password
        </NotificationBanner>
      </>
    );
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
