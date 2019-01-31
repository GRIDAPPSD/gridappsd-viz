import * as React from 'react';

import './MultilineFormControl.scss';

interface Props {
  label: string;
  value: string;
  onUpdate: (value: string) => void;
  className?: string;
}

export const MultilineFormControl = (props: Props) => (
  <div className={'gridappsd-form-control multiline' + (props.className ? ` ${props.className}` : '')}>
    <label className='gridappsd-form-control__label'>{props.label}</label>
    <div
      className='gridappsd-form-control__multiline-input'
      contentEditable
      suppressContentEditableWarning
      onBlur={event => props.onUpdate((event.target as HTMLDivElement).textContent)}>
      {props.value}
    </div>
  </div>
);