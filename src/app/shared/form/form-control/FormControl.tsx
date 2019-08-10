import * as React from 'react';

import './FormControl.scss';

interface Props {
  label: string;
  className: string;
  children: any;
  hint?: string;
  disabled?: boolean;
  isInvalid?: boolean;
}

export function FormControl(props: Props) {
  return (
    <div className={calculateClassNameFromProps(props)}>
      <label className='form-control__label'>
        {props.label}
        &nbsp;
      {props.hint && <span className='form-control__label__hint'>({props.hint})</span>}
      </label>
      <div className='form-control__body'>
        {props.children}
      </div>
    </div>
  );
}

function calculateClassNameFromProps(props: Props) {
  return `form-control ${props.className}`
    + (props.disabled ? ' disabled' : '')
    + (props.isInvalid ? ' invalid' : '');
}
