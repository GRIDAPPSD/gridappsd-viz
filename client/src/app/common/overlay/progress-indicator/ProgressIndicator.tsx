import { Component, createRef } from 'react';

import { Backdrop } from '@client:common/overlay/backdrop';

import './ProgressIndicator.light.scss';
import './ProgressIndicator.dark.scss';

interface Props {
  show: boolean;
}

interface State {
  height: number;
}

export class ProgressIndicator extends Component<Props, State> {

  readonly waitElementRef = createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);
    this.state = {
      height: 0
    };
  }

  componentDidMount() {
    if (this.waitElementRef.current) {
      let height = this.waitElementRef.current.clientHeight;
      if (height === 0) {
        let waitElementParent = this.waitElementRef.current.parentElement;
        while (height === 0 && waitElementParent !== null) {
          height = waitElementParent.clientHeight;
          waitElementParent = waitElementParent.parentElement;
        }
      }
      this.setState({
        height
      });
    }
  }

  render() {
    if (this.props.show) {
      return (
        <div
          ref={this.waitElementRef}
          className='progress-indicator'
          style={{
            height: this.state.height > 0 ? this.state.height + 'px' : '100%'
          }}>
          <Backdrop visible />
          <div className='progress-indicator__dot-container'>
            <span className='progress-indicator__dot' />
            <span className='progress-indicator__dot' />
            <span className='progress-indicator__dot' />
            <span className='progress-indicator__dot' />
            <span className='progress-indicator__dot' />
            <span className='progress-indicator__dot' />
            <span className='progress-indicator__dot' />
            <span className='progress-indicator__dot' />
            <span className='progress-indicator__dot' />
          </div>
        </div>
      );
    }
    return null;
  }

}
