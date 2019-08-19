import * as React from 'react';

import { Input } from '@shared/form';
import { BasicButton, IconButton } from '@shared/buttons';
import { Validators } from '@shared/form/validation';
import { User } from '@shared/authentication';
import { NotificationBanner } from '@shared/notification-banner';
import { Tooltip } from '@shared/tooltip';

import './LoginScreen.scss';

interface Props {
  user: User;
  onLogin: (username: string, password: string) => void;
}

interface State {
  disableLoginButton: boolean;
  showFailedLoginNofitification: boolean;
  passwordVisible: boolean;
}

export class LoginScreen extends React.Component<Props, State> {

  username = 'system';
  password = 'manager';

  private _failedLoginNotificationBannerAnimation: any;

  constructor(props: Props) {
    super(props);

    this.state = {
      disableLoginButton: false,
      showFailedLoginNofitification: false,
      passwordVisible: false
    };

    this.onUsernameEntered = this.onUsernameEntered.bind(this);
    this.onUsernameInputValidated = this.onUsernameInputValidated.bind(this);
    this.onPasswordEntered = this.onPasswordEntered.bind(this);
    this.onPasswordInputValidated = this.onPasswordInputValidated.bind(this);
    this.login = this.login.bind(this);
    this.togglePasswordVisibility = this.togglePasswordVisibility.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.user !== prevProps.user && !this.props.user.isAuthenticated) {
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
    return (
      <div className='login-screen-container'>
        <div className='login-screen'>
          <Input
            className='login-screen__username'
            label='Username'
            name='username'
            value='system'
            validators={[
              Validators.checkNotEmpty('Username is required')
            ]}
            onChange={this.onUsernameEntered}
            onValidate={this.onUsernameInputValidated} />
          <div className='login-screen__password-container'>
            <Input
              className='login-screen__password'
              label='Password'
              name='password'
              type={this.state.passwordVisible ? 'text' : 'password'}
              value='manager'
              validators={[
                Validators.checkNotEmpty('Password is required')
              ]}
              onChange={this.onPasswordEntered}
              onValidate={this.onPasswordInputValidated} />
            <Tooltip content={this.state.passwordVisible ? 'Hide password' : 'Show password'}>
              <IconButton
                icon={this.state.passwordVisible ? 'visibility_off' : 'visibility'}
                size='small'
                style='accent'
                onClick={this.togglePasswordVisibility} />
            </Tooltip>
          </div>
          <BasicButton
            className='login-screen__login-button'
            type='positive'
            label='Log in'
            disabled={this.state.disableLoginButton}
            onClick={this.login} />
          {
            this.props.user
            &&
            <NotificationBanner
              show={this.state.showFailedLoginNofitification}
              dismissable={true}>
              Incorrect username or password
            </NotificationBanner>
          }
        </div>
      </div>
    );
  }

  onUsernameEntered(value: string) {
    this.username = value;
  }

  onUsernameInputValidated(isValid: boolean) {
    if (!isValid) {
      this.setState({
        disableLoginButton: true
      });
    }
    else if (this.password !== '')
      this.setState({
        disableLoginButton: false
      });
  }

  onPasswordEntered(value: string) {
    this.password = value;
  }

  onPasswordInputValidated(isValid: boolean) {
    if (!isValid) {
      this.setState({
        disableLoginButton: true
      });
    }
    else if (this.username !== '')
      this.setState({
        disableLoginButton: false
      });
  }

  togglePasswordVisibility() {
    this.setState(state => ({
      passwordVisible: !state.passwordVisible
    }));
  }

  login() {
    this.props.onLogin(this.username, this.password);
    this._abortAnimatingFailedLoginNotificationBanner();
  }

  private _abortAnimatingFailedLoginNotificationBanner() {
    clearTimeout(this._failedLoginNotificationBannerAnimation);
    this.setState({
      showFailedLoginNofitification: false
    });
  }

}
