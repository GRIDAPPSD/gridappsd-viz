import * as React from 'react';

import './FormControl.scss';

interface Props {
  label: string;
  className: string;
  hint?: string;
  children?: any;
}

export function FormControl(props: Props) {
  return (
    <div className={`form-control ${props.className}`}>
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