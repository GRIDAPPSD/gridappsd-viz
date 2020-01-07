import * as React from 'react';

import { Ripple } from '../../ripple/Ripple';

import './BasicButton.light.scss';
import './BasicButton.dark.scss';

interface Props {
  label: string;
  type: 'positive' | 'negative';
  className?: string;
  disabled?: boolean;
  onClick: (event: React.MouseEvent) => void;
}

export function BasicButton(props: Props) {
  return (
    <Ripple>
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
