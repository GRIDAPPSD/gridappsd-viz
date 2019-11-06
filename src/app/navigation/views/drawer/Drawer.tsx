import * as React from 'react';

import { Backdrop } from '@shared/backdrop';

import './Drawer.light.scss';
import './Drawer.dark.scss';

interface Props {
}

interface State {
  isOpened: boolean;
}
export class Drawer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      isOpened: false
    };

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
  }

  shouldComponentUpdate(_, nextState: State) {
    return this.state.isOpened !== nextState.isOpened;
  }

  render() {
    return (
      <div className={'drawer' + (this.state.isOpened ? ' opened' : ' closed')}>
        <Backdrop visible={this.state.isOpened} onClick={this.close} />
        <ul className='drawer-items' onClick={this.close}>
          {this.props.children}
        </ul>
      </div>
    );
  }

  open() {
    this.setState({ isOpened: true });
  }

  close() {
    this.setState({ isOpened: false });
  }

}
