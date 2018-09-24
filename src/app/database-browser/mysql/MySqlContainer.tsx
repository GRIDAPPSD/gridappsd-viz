import * as React from 'react';

import { MySql } from './MySql';


interface Props {
}

interface State {
}

export class MySqlContainer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
  }

  render() {
    return (
      <MySql />
    );
  }

}