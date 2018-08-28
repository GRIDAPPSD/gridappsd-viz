import * as React from 'react';

import { InfluxDb } from './InfluxDb';


interface Props {
}

interface State {

}

export class InfluxDbContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <InfluxDb />
    );
  }

}