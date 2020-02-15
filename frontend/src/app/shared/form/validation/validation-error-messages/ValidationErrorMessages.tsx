import * as React from 'react';

import './ValidationErrorMessages.light.scss';
import './ValidationErrorMessages.dark.scss';

interface Props {
  messages: string[];
}

export function ValidationErrorMessages(props: Props) {
  if (!props.messages || props.messages.length === 0) {
    return null;
  }
  return (
    <ul className='validation-error-message-container'>
      {props.messages.map((message, i) => <li key={i} className='validation-error-message'>{message}</li>)}
    </ul>
  );
}
