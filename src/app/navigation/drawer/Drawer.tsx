import * as React from 'react';

import { Backdrop } from '@shared/backdrop';

import './Drawer.scss';

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
    this.close = this.close.bind(this);
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
  close(event?) {
    this.setState({ isOpened: false });
  }

}