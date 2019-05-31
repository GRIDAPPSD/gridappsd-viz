import * as React from 'react';

import { FormControl } from '../form-control/FormControl';

import './TextArea.scss';

interface Props {
  label: string;
  value: string;
  onUpdate: (value: string) => void;
  className?: string;
}

export const TextArea = (props: Props) => (
  <FormControl
    className={'textarea' + (props.className ? ` ${props.className}` : '')}
    label={props.label}>
    <div
      className='textarea__input-box'
      contentEditable
      suppressContentEditableWarning
      onBlur={event => props.onUpdate((event.target as HTMLDivElement).textContent)}>
      {props.value}
    </div>
  </FormControl>
);