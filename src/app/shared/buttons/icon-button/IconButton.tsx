import * as React from 'react';

import { Ripple } from '../../ripple/Ripple';

import './IconButton.scss';

type Icon = 'check_circle' | 'menu' | 'assignment' | 'storage' | 'search' | 'laptop' | 'help' | 'delete' | 'cloud_upload'
  | 'pause' | 'stop' | 'play_arrow' | 'add' | 'remove' | 'cached' | 'save' | 'close' | 'navigate_next' | 'navigate_before'
  | 'keyboard_arrow_down';


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
    <Ripple fixed={props.rounded}>
      <button
        type='button'
        disabled={props.disabled}
        className={
          'icon-button' +
          (props.className ? ' ' + props.className : '') +
          (props.label ? ' icon-button--has-label' : '') +
          (props.rounded === undefined || props.rounded ? ' rounded-icon-button' : '') +
          (' icon-button--' + (props.style ? props.style : 'primary')) +
          (' rounded-icon-button--' + (props.size ? props.size : 'normal'))
        }
        onClick={props.onClick}>
        <i className='material-icons icon-button__icon'>{props.icon}</i>
        {props.label && <span className='icon-button__label'>{props.label}</span>}
      </button>
    </Ripple>
  );
}