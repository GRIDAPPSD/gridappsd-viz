import * as React from 'react';

import { Fade } from '@shared/fade';
import { IconButton } from '@shared/buttons';
import { Backdrop } from '@shared/backdrop';

import './NotificationBanner.scss';

interface Props {
  persistent?: boolean;
  show?: boolean;
  dismissable?: boolean;
}

interface State {
  slide: 'in' | 'out';
}

export class NotificationBanner extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      slide: props.persistent ? 'in' : props.show ? 'in' : 'out'
    };

    this.hideNotificationBanner = this.hideNotificationBanner.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.show !== prevProps.show)
      this.setState({
        slide: this.props.show ? 'in' : 'out'
      });
  }

  render() {
    if (!this.props.persistent)
      return (
        <div className={`notification-banner not-persistent slide-${this.state.slide}`}>
          {
            this.props.dismissable
            &&
            <IconButton
              icon='close'
              style='accent'
              onClick={this.hideNotificationBanner} />
          }
          <div className='notification-banner__content'>
            {this.props.children}
          </div>
        </div>
      );
    return (
      <Fade fadeIn={true}>
        <div className='notification-banner persistent'>
          <Backdrop visible={true} />
          <div className='notification-banner__content'>
            {this.props.children}
          </div>
        </div>
      </Fade>
    );
  }

  hideNotificationBanner() {
    this.setState({
      slide: 'out'
    });
  }

}
