import * as React from 'react';

import './FormControl.scss';

interface Props {
  label: string;
  type?: string;
  name: string;
  value: string;
  onUpdate: (value: string) => void;
  hint?: string;
  className?: string;
}

export const FormControl = (props: Props = { type: 'text' } as Props) => (
  <div className={'gridappsd-form-control' + (props.className ? ` ${props.className}` : '')}>
    <label className='gridappsd-form-control__label'>
      {props.label}
      &nbsp;
      {props.hint && <span className='gridappsd-form-control__label__hint'>({props.hint})</span>}
    </label>
    <span className='gridappsd-form-control__ripple-input-field'>
      <input
        type={props.type}
        name={props.name}
        className='simulation-name gridappsd-form-control__ripple-input-field__input'
        onBlur={event => props.onUpdate((event.target as HTMLInputElement).value)}
        defaultValue={props.value} />
      <span className='gridappsd-form-control__ripple-input-field__ripple-bar' />
    </span>
  </div>
);