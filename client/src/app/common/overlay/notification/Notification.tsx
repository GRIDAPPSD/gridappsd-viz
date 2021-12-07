import { Component } from 'react';

import { PortalRenderer } from '@client:common/overlay/portal-renderer';
import { IconButton } from '@client:common/buttons';

import './Notification.light.scss';
import './Notification.dark.scss';

interface Props {
  show?: boolean;
  onHide?: () => void;
}

interface State {
  show: boolean;
}

export class Notification extends Component<Props, State> {

  static defaultProps = {
    show: true
  } as Props;

  static readonly LIFE_TIME = 30_000;
  static readonly ANIMATION_DURATION = 500;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _scheduler: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      show: props.show
    };

    this.hideNotification = this.hideNotification.bind(this);
  }

  static open(content: React.ReactChild) {
    return new Promise<void>(resolve => {
      const portalRenderer = new PortalRenderer();
      portalRenderer.mount(
        <Notification
          onHide={() => {
            resolve();
            portalRenderer.unmount();
          }}>
          {content}
        </Notification>
      );
    });
  }

  componentDidMount() {
    if (this.props.show) {
      this._showNotification();
    }
  }

  private _showNotification() {
    this.setState({
      show: true
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
      show: false
    });
  }

  componentWillUnmount() {
    clearTimeout(this._scheduler);
  }

  render() {
    return (
      <div className={`notification-container ${this.state.show ? 'visible' : 'hidden'}`}>
        <div className='notification'>
          {this.props.children}
          <IconButton
            className='notification__close'
            icon='close'
            hasBackground={false}
            rippleDuration={500}
            onClick={this.hideNotification} />
        </div>
      </div>
    );
  }

}
