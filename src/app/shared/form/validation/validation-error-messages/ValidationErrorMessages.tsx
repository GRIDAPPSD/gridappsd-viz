import * as React from 'react';

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
