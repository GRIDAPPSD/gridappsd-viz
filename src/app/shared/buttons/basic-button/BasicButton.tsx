import * as React from 'react';

import { Ripple } from '../../ripple/Ripple';

import './BasicButton.scss';

interface Props {
  type: 'positive' | 'negative';
  className?: string;
  label: string;
  onClick: (event: any) => void;
  disabled?: boolean;
}

export const BasicButton = (props: Props) => (
  <Ripple>
    <button
      type='button'
      className={props.type + (props.className ? ` ${props.className}` : '')}
      disabled={props.disabled}
      onClick={props.onClick}>
      {props.label}
    </button>
  </Ripple>
);