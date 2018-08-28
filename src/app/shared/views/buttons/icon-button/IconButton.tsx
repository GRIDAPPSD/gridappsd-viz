import * as React from 'react';

import './IconButton.scss';
import { Ripple } from '../../ripple/Ripple';

interface Props {
  icon: 'plus' | 'minus' | 'question';
  onClick?: (event) => void;
  children?: React.ReactElement<any>;
}

export const IconButton = (props: Props) => (
  <Ripple>
    <button
      type='button'
      className={'app-icon icon-button ' + props.icon}
      onClick={props.onClick}>
      {props.children}
    </button>
  </Ripple>
);