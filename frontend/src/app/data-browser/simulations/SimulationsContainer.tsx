import * as React from 'react';

import { Simulations } from './Simulations';


interface Props {
}

interface State {

}

export class SimulationsContainer extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
  }

  render() {
    return (
      <Simulations />
    );
  }

}
