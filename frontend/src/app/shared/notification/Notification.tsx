import * as React from 'react';
import { createPortal, render, unmountComponentAtNode } from 'react-dom';

import { IconButton } from '@shared/buttons';

import './Notification.light.scss';
import './Notification.dark.scss';

interface Props {
  show?: boolean;
  onHide?: () => void;
}

interface State {
  slide: 'in' | 'out';
}

export class Notification extends React.Component<Props, State> {

  static defaultProps = {
    show: true
  } as Props;

  static readonly LIFE_TIME = 5_000;
  static readonly ANIMATION_DURATION = 500;

  readonly notificationContainer = document.createElement('div');

  private _scheduler: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      slide: props.show ? 'in' : 'out'
    };

    this.notificationContainer.className = 'notification-container';

    this.hideNotification = this.hideNotification.bind(this);
  }

  componentDidMount() {
    if (this.props.show) {
      this._showNotification();
    }
  }

  private _showNotification() {
    if (!document.body.contains(this.notificationContainer)) {
      document.body.appendChild(this.notificationContainer);
    }
    this.setState({
      slide: 'in'
    });
    this._scheduler = setTimeout(this.hideNotification, Notification.LIFE_TIME);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.show !== prevProps.show) {
      if (this.props.show) {
        this._showNotification();
      } else {
        clearTimeout(this._scheduler);
        this.hideNotification();
      }
    }
  }

  hideNotification() {
    if (this.props.onHide) {
      setTimeout(this.props.onHide, Notification.ANIMATION_DURATION);
    }
    this.setState({
      slide: 'out'
    });
  }

  componentWillUnmount() {
    if (document.body.contains(this.notificationContainer)) {
      document.body.removeChild(this.notificationContainer);
    }
    clearTimeout(this._scheduler);
  }

  render() {
    if (!document.body.contains(this.notificationContainer)) {
      return null;
    }
    return createPortal(
      <div className={'notification slide-' + this.state.slide}>
        <IconButton
          icon='close'
          style='accent'
          onClick={this.hideNotification} />
        <div className='notification__content'>
          {this.props.children}
        </div>
      </div>,
      this.notificationContainer
    );
  }

}

export function showNotification(content: React.ReactChild) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    <Notification onHide={() => {
      unmountComponentAtNode(container);
      document.body.removeChild(container);
    }}>
      {content}
    </Notification>,
    container
  );
}
