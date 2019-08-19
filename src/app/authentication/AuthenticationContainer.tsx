import * as React from 'react';
import { Subscription } from 'rxjs';

import { LoginScreen } from './views/login-screen/LoginScreen';
import { User, AuthenticationService } from '@shared/authentication';
import { StateStore } from '@shared/state-store';

interface Props {
}

interface State {
  user: User;
}

export class AuthenticationContainer extends React.Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _authenticationService = AuthenticationService.getInstance();

  private _authenticatingUserSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      user: this._authenticationService.findAuthenticatedUserInCurrentSession()
    };

    this.tryLogin = this.tryLogin.bind(this);
  }

  componentDidMount() {
    this._authenticatingUserSubscription = this._stateStore.select('currentUser')
      .subscribe({
        next: user => this.setState({ user })
      });
  }

  componentWillUnmount() {
    this._authenticatingUserSubscription.unsubscribe();
  }

  render() {
    if (this.state.user && this.state.user.isAuthenticated)
      return this.props.children;
    return (
      <LoginScreen
        user={this.state.user}
        onLogin={this.tryLogin} />
    );
  }

  tryLogin(username: string, password: string) {
    this._authenticationService.authenticate(username, password)
      .subscribe({
        next: user => this.setState({ user })
      });
  }

}
