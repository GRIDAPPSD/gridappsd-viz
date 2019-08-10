import * as React from 'react';

import './FormGroup.scss';

interface Props {
  label?: string;
  children: any;
  className?: string;
}

export function FormGroup(props: Props) {
  return (
    <div className={`form-group${props.className ? ' ' + props.className : ''}`}>
      {
        props.label &&
        <header className='form-group__heading'>{props.label}</header>
      }
      <div className='form-group__controls'>
        {props.children}
      </div>
    </div>
  );
}
