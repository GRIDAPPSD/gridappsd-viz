import * as React from 'react';

import { Fade } from '@shared/fade';
import { IconButton } from '@shared/buttons';
import { Backdrop } from '@shared/backdrop';

import './NotificationBanner.scss';

interface Props {
  persistent?: boolean;
}

interface State {
  slide: 'in' | 'out';
}

export class NotificationBanner extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      slide: 'in'
    };

    this.hideNotificationBanner = this.hideNotificationBanner.bind(this);
  }

  componentDidMount() {
    setTimeout(this.hideNotificationBanner, 10_000);
  }

  render() {
    if (!this.props.persistent)
      return (
        <div className={'notification-banner not-persistent slide-' + this.state.slide}>
          <IconButton
            icon='close'
            style='accent'
            onClick={this.hideNotificationBanner} />
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
