import * as React from 'react';

import './CheckBox.scss';

interface Props {
  label: string;
  name: string;
  onChange?: (state: boolean) => void;
  disabled?: boolean;
  hint?: string;
  checked?: boolean;
}

export const CheckBox = (props: Props) => {
  return (
    <div className={'gridappsd-checkbox' + (props.disabled ? ' disabled-checkbox' : '')}>
      <label className='gridappsd-checkbox__label'>{props.label}</label>
      <input
        className={'gridappsd-checkbox__input'}
        ref={checkbox => {
          if (checkbox && props.checked)
            checkbox.checked = true;
        }}
        type='checkbox'
        name={props.name}
        disabled={props.disabled}
        onChange={event => props.onChange(event.currentTarget.checked)} />
      <i className='app-icon gridappsd-checkbox__icon'></i>
      {
        props.hint && <span className='gridappsd-checkbox__hint'>{props.hint}</span>
      }
    </div>
  );
}