import * as React from 'react';

import './FormControl.light.scss';
import './FormControl.dark.scss';

interface Props {
  label: string;
  className: string;
  children: React.ReactNode;
  hint?: string;
  disabled?: boolean;
  isInvalid?: boolean;
  htmlFor?: string;
}

export function FormControl(props: Props) {
  return (
    <div className={calculateClassNameFromProps(props)}>
      <label
        className='form-control__label'
        htmlFor={props.htmlFor}>
        {props.label}
        &nbsp;
        <span className='form-control__label__hint'>{props.hint}</span>
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
