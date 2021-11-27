import * as React from 'react';

import { AuthenticatorService } from '@shared/authenticator';

interface Props {
  roles: string[];
}

interface State {
}

export class Restricted extends React.Component<Props, State> {

  readonly authenticatorService = AuthenticatorService.getInstance();

  render() {
    return (
      this.props.roles.some(this.authenticatorService.userHasRole)
      &&
      this.props.children
    );
  }

}
