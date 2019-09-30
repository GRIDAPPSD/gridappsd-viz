import * as React from 'react';

import { Backdrop } from '../backdrop/Backdrop';

import './Wait.scss';

interface Props {
  show: boolean;
}

interface State {
  height: number;
}

export class Wait extends React.Component<Props, State> {
  waitElement: HTMLDivElement;

  constructor(props: any) {
    super(props);
    this.state = {
      height: 0
    };
  }

  componentDidMount() {
    if (this.waitElement) {
      let height = this.waitElement.clientHeight;
      if (height === 0) {
        let waitElementParent = this.waitElement.parentElement;
        while (height === 0 && waitElementParent !== null) {
          height = waitElementParent.clientHeight;
          waitElementParent = waitElementParent.parentElement;
        }
      }
      this.setState({ height });
    }
  }

  render() {
    if (this.props.show)
      return (
        <div
          ref={element => this.waitElement = element}
          className='wait'
          style={{
            height: this.state.height > 0 ? this.state.height + 'px' : '100vh'
          }}>
          <Backdrop visible />
          <div className='dots'>
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
            <span className='dot' />
          </div>
        </div>
      );
    return null;
  }

}
