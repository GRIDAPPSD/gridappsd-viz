import * as React from 'react';

import { ValidationResult } from '../ValidationResult';

import './ValidationErrorMessages.scss';

interface Props {
  messages: string[];
}

export function ValidationErrorMessages(props: Props) {
  return (
    <ul className='validation-error-message-container'>
      {props.messages.map((message, i) => <li key={i} className='validation-error-message'>{message}</li>)}
    </ul>
  );
}