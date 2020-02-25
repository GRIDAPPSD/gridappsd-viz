import * as React from 'react';

import { Backdrop } from '@shared/overlay/backdrop';

import './Drawer.light.scss';
import './Drawer.dark.scss';

interface Props {
}

interface State {
  isOpen: boolean;
}
export class Drawer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      isOpen: false
    };

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
  }

  shouldComponentUpdate(_, nextState: State) {
    return this.state.isOpen !== nextState.isOpen;
  }

  render() {
    return (
      <div className={`drawer ${this.state.isOpen ? 'open' : 'closed'}`}>
        <Backdrop visible={this.state.isOpen} onClick={this.close} />
        <ul className='drawer-items' onClick={this.close}>
          {this.props.children}
        </ul>
      </div>
    );
  }

  open() {
    this.setState({
      isOpen: true
    });
  }

  close() {
    this.setState({
      isOpen: false
    });
  }

}
