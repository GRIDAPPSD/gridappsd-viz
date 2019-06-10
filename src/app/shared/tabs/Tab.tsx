import * as React from 'react';

import './Tab.scss';

interface Props {
  label: string;
}

interface State {
}

export class Tab extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      this.props.children
    );
  }
}