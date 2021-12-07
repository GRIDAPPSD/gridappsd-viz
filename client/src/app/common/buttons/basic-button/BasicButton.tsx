import { Ripple } from '../../ripple/Ripple';

import './BasicButton.light.scss';
import './BasicButton.dark.scss';

interface Props {
  /**
   * The text to show in the button
   */
  label: string;

  /**
   * Type `positive` is used for buttons such as "Confirm", "Submit", "Apply", etc.
   * Type `negative` is used for buttons such as "Cancel", "Dismiss", "Close", etc.
   */
  type: 'positive' | 'negative';
  onClick: (event: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Basic buttons are buttons with a rectangular shape and rounded corners
 *
 * @param props
 */
export function BasicButton(props: Props) {
  return (
    <Ripple>
      <button
        type='button'
        className={'basic-button ' + props.type + (props.className ? ` ${props.className}` : '')}
        disabled={props.disabled}
        onClick={props.onClick}>
        {props.label}
      </button>
    </Ripple>
  );
}
