import * as React from 'react';
import { createPortal } from 'react-dom';

import { Fade } from '@shared/fade';
import { IconButton } from '@shared/buttons';
import { Backdrop } from '@shared/backdrop';

import './NotificationBanner.light.scss';
import './NotificationBanner.dark.scss';

interface Props {
  persistent?: boolean;
  onHide?: () => void;
  show?: boolean;
}

interface State {
  slide: 'in' | 'out';
}

export class NotificationBanner extends React.Component<Props, State> {

  static defaultProps = {
    show: true
  } as Props;

  static readonly LIFE_TIME = 5_000;

  notificationBannerContainer = document.createElement('div');

  private _scheduler: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      slide: props.show ? 'in' : 'out'
    };

    this.notificationBannerContainer.className = 'notification-banner-container';

    this.hideNotificationBanner = this.hideNotificationBanner.bind(this);
  }

  componentDidMount() {
    if (this.props.show)
      this._showNotificationBanner();
  }

  private _showNotificationBanner() {
    if (!document.body.contains(this.notificationBannerContainer))
      document.body.appendChild(this.notificationBannerContainer);
    this.setState({
      slide: 'in'
    });
    if (!this.props.persistent)
      this._scheduler = setTimeout(this.hideNotificationBanner, NotificationBanner.LIFE_TIME);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.show !== prevProps.show) {
      if (this.props.show)
        this._showNotificationBanner();
      else {
        clearTimeout(this._scheduler);
        this.hideNotificationBanner();
      }
    }
  }

  hideNotificationBanner() {
    this.setState({
      slide: 'out'
    }, this.props.onHide);
  }

  componentWillUnmount() {
    if (document.body.contains(this.notificationBannerContainer))
      document.body.removeChild(this.notificationBannerContainer);
    clearTimeout(this._scheduler);
  }

  render() {
    if (!this.props.persistent) {
      if (!document.body.contains(this.notificationBannerContainer))
        return null;
      return createPortal(
        <div className={'notification-banner not-persistent slide-' + this.state.slide}>
          <IconButton
            icon='close'
            style='accent'
            onClick={this.hideNotificationBanner} />
          <div className='notification-banner__content'>
            {this.props.children}
          </div>
        </div>,
        this.notificationBannerContainer
      );
    }
    return (
      <Fade in={true}>
        <div className='notification-banner persistent'>
          <Backdrop visible={true} />
          <div className='notification-banner__content'>
            {this.props.children}
          </div>
        </div>
      </Fade>
    );
  }

}
