import * as React from 'react';

import { Ripple } from '../../ripple/Ripple';

import './BasicButton.scss';

interface Props {
  label: string;
  type: 'positive' | 'negative';
  className?: string;
  disabled?: boolean;
  rippleColor?: string;
  onClick: (event: React.MouseEvent) => void;
}

export function BasicButton(props: Props) {
  return (
    <Ripple color={props.rippleColor || (props.type === 'positive' ? 'rgba(250, 250, 250, 0.5)' : undefined)}>
      <button
        type='button'
        className={'basic-button ' + props.type + (props.className ? ` ${props.className}` : '')}
        disabled={props.disabled}
        onClick={props.onClick}>
        {props.label}
      </button>
    </Ripple>
  );
}
