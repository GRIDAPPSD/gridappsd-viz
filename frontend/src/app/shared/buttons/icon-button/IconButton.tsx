import * as React from 'react';

import { Ripple } from '../../ripple/Ripple';

import './IconButton.light.scss';
import './IconButton.dark.scss';

type Icon = 'check_circle' | 'menu' | 'assignment' | 'storage' | 'search' | 'laptop' | 'delete'
  | 'cloud_upload' | 'pause' | 'stop' | 'play_arrow' | 'add' | 'remove' | 'cached' | 'save'
  | 'close' | 'navigate_next' | 'navigate_before' | 'keyboard_arrow_down' | 'memory' | 'send'
  | 'show_chart' | 'edit' | 'help_outline' | 'arrow_downward' | 'refresh' | 'search' | 'check'
  | 'notifications' | 'more_vert' | 'visibility' | 'visibility_off';

interface Props {
  icon: Icon;
  size?: 'large' | 'normal' | 'small';
  className?: string;
  label?: any;
  rounded?: boolean;
  style?: 'primary' | 'accent';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  hasBackground?: boolean;
  rippleDuration?: number;
}

export class IconButton extends React.Component<Props, {}> {

  readonly buttonRef = React.createRef<HTMLButtonElement>();

  componentDidUpdate(prevProps: Props) {
    if (this.props.disabled !== prevProps.disabled && this.props.disabled) {
      // When the button is disabled
      // Chrome does not fire a mouseout event at all
      // so we fire it manually
      this.buttonRef.current.dispatchEvent(new CustomEvent('mouseout'));
    }
  }

  render() {
    return (
      <Ripple
        fixed={this.props.label ? false : this.props.rounded || this.props.rounded === undefined}
        duration={this.props.rippleDuration}>
        <button
          ref={this.buttonRef}
          type='button'
          disabled={this.props.disabled}
          className={this.deriveClassName()}
          onClick={this.props.onClick}>
          <i className='material-icons icon-button__icon'>{this.props.icon}</i>
          {
            this.props.label
            &&
            <span className='icon-button__label'>
              {this.props.label}
            </span>
          }
        </button>
      </Ripple>
    );
  }


  deriveClassName() {
    const classNames = [
      'icon-button',
      `icon-button--${this.props.style}`,
      this.props.hasBackground ? 'has-background' : 'no-background',
    ];
    if (this.props.label) {
      classNames.push('icon-button--has-label');
    }
    if (this.props.className) {
      classNames.push(this.props.className);
    }
    if (this.props.rounded && !this.props.label) {
      classNames.push(`rounded-icon-button rounded-icon-button--${this.props.size}`);
    }
    return classNames.join(' ');
  }

}

(IconButton as any).defaultProps = {
  size: 'normal',
  rounded: true,
  style: 'primary',
  hasBackground: true
};
