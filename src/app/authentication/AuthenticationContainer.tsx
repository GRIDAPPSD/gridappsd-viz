import * as React from 'react';
import { Subscription } from 'rxjs';

import { User, AuthenticationService } from '@shared/authentication';
import { StateStore } from '@shared/state-store';
import { Authentication } from './Authentication';

interface Props {
}

interface State {
  authenticatingUser: User;
}

export class AuthenticationContainer extends React.Component<Props, State> {

  private readonly _stateStore = StateStore.getInstance();
  private readonly _authenticationService = AuthenticationService.getInstance();

  private _authenticatingUserSubscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      authenticatingUser: null
    };

    this._stateStore.update({
      currentUser: this._authenticationService.findAuthenticatedUserInCurrentSession()
    });

    this.tryLogin = this.tryLogin.bind(this);
  }

  componentDidMount() {
    this._authenticatingUserSubscription = this._stateStore.select('currentUser')
      .subscribe({
        next: user => this.setState({ authenticatingUser: user })
      });
  }

  componentWillUnmount() {
    this._authenticatingUserSubscription.unsubscribe();
  }

  render() {
    return (
      <Authentication
        authenticatingUser={this.state.authenticatingUser}
        tryLogin={this.tryLogin}>
        {this.props.children}
      </Authentication>
    );
  }

  tryLogin(username: string, password: string) {
    this._authenticationService.authenticate(username, password)
      .subscribe({
        next: user => {
          this._stateStore.update({
            currentUser: user
          });
          this.setState({
            authenticatingUser: user
          });
        }
      });
  }

}
