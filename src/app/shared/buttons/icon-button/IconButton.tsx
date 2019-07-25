import * as React from 'react';

import { Ripple } from '../../ripple/Ripple';

import './IconButton.scss';

type Icon = 'check_circle' | 'menu' | 'assignment' | 'storage' | 'search' | 'laptop' | 'help' | 'delete' | 'cloud_upload'
  | 'pause' | 'stop' | 'play_arrow' | 'add' | 'remove' | 'cached' | 'save' | 'close' | 'navigate_next' | 'navigate_before'
  | 'keyboard_arrow_down' | 'memory' | 'send';


interface Props {
  icon: Icon;
  onClick?: (event) => void;
  size?: 'large' | 'normal' | 'small';
  className?: string;
  label?: any;
  rounded?: boolean;
  style?: 'primary' | 'accent' | 'default';
  disabled?: boolean;
}

export function IconButton(props: Props) {
  return (
    <Ripple fixed={props.rounded || props.rounded === undefined}>
      <button
        type='button'
        disabled={props.disabled}
        className={
          'icon-button' +
          (props.className ? ' ' + props.className : '') +
          (' icon-button--' + (props.style ? props.style : 'primary')) +
          deriveClassName(props)
        }
        onClick={props.onClick}>
        <i className='material-icons icon-button__icon'>{props.icon}</i>
        {props.label && <span className='icon-button__label'>{props.label}</span>}
      </button>
    </Ripple>
  );
}

function deriveClassName(props: Props) {
  if (props.rounded || (props.rounded === undefined && !props.label))
    return ` rounded-icon-button rounded-icon-button--${props.size ? props.size : 'normal'}`;
  return props.label ? ' icon-button--has-label' : '';

}
