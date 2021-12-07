import './ValidationErrorMessageDisplay.light.scss';
import './ValidationErrorMessageDisplay.dark.scss';

interface Props {
  messages: string[];
}

export function ValidationErrorMessageDisplay(props: Props) {
  if (!props.messages || props.messages.length === 0) {
    return null;
  }
  return (
    <ul className='validation-error-message-display'>
      {props.messages.map((message, i) => <li
        key={i}
        className='validation-error-message-display__message'>{message}</li>)}
    </ul>
  );
}
