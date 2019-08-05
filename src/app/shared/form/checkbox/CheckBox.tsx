import * as React from 'react';

import { FormControl } from '../form-control/FormControl';

import './CheckBox.scss';

interface Props {
  label: string;
  name: string;
  onChange?: (state: boolean) => void;
  disabled?: boolean;
  checked?: boolean;
  labelPosition?: 'left' | 'right';
}

export function CheckBox(props: Props) {
  return (
    <FormControl
      className={`checkbox label-position-${props.labelPosition === undefined ? 'left' : props.labelPosition}`}
      disabled={props.disabled}
      label={props.label}>
      <div className='checkbox-wrapper'>
        <input
          className={'checkbox__input'}
          ref={checkbox => {
            if (checkbox)
              checkbox.checked = props.checked;
          }}
          type='checkbox'
          name={props.name}
          disabled={props.disabled}
          onChange={event => props.onChange(event.currentTarget.checked)} />
        <i className='material-icons checkbox__icon checkbox__icon__unchecked'>check_box_outline_blank</i>
        <i className='material-icons checkbox__icon checkbox__icon__checked'>check_box</i>
      </div>
    </FormControl>
  );
}
