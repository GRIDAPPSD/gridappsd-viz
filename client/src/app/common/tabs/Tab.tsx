
import { Component } from 'react';

import './Tab.light.scss';
import './Tab.dark.scss';

interface Props {
  label: string;
}

interface State {
}

export class Tab extends Component<Props, State> {

  constructor(props: Props) {
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
