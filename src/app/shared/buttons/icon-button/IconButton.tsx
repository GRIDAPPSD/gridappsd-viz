import * as React from 'react';

import { Ripple } from '../../ripple/Ripple';
import './IconButton.scss';

type Icon = 'plus' | 'minus' | 'question' | 'websocket-connection-active' | 'websocket-connection-inactive' |
  'start' | 'stop' | 'pause' | 'resume';

interface Props {
  icon: Icon;
  onClick?: (event) => void;
  children?: any;
  className?: string;
  label?: any;
}

export const IconButton = (props: Props) => (
  <Ripple>
    <button
      type='button'
      className={'app-icon icon-button ' + props.icon + (props.className ? ' ' + props.className : '') + (props.label ? ' has-label' : '')}
      onClick={props.onClick}>
      {props.label && <span>{props.label}</span>}
    </button>
  </Ripple>
);