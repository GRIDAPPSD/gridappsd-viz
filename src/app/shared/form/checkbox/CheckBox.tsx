import * as React from 'react';

import { FormControl } from '../form-control/FormControl';

import './CheckBox.scss';

interface Props<T> {
  label: string;
  name: string;
  onChange: (togglingState: boolean, value: T) => void;
  disabled?: boolean;
  checked?: boolean;
  labelPosition?: 'left' | 'right';
  className?: string;
  hint?: string;
  value?: T;
}

interface State {

}
export class CheckBox<T> extends React.Component<Props<T>, State> {

  constructor(props: Props<T>) {
    super(props);

    this.onCheckBoxToggled = this.onCheckBoxToggled.bind(this);
  }

  render() {
    return (
      <FormControl
        className={this.resolveClassNames()}
        disabled={this.props.disabled}
        label={this.props.label}
        htmlFor={this.props.label}
        hint={this.props.hint}>
        <div className='checkbox-wrapper'>
          <input
            className={'checkbox__input'}
            id={this.props.label}
            ref={checkbox => {
              if (checkbox)
                checkbox.checked = this.props.checked;
            }}
            type='checkbox'
            name={this.props.name}
            disabled={this.props.disabled}
            onChange={this.onCheckBoxToggled} />
          <i className='material-icons checkbox__icon checkbox__icon__unchecked'>
            check_box_outline_blank
          </i>
          <i className='material-icons checkbox__icon checkbox__icon__checked'>
            check_box
          </i>
        </div>
      </FormControl>
    );
  }

  resolveClassNames() {
    return (
      'checkbox ' +
      `label-position-${this.props.labelPosition === undefined ? 'left' : this.props.labelPosition}` +
      (this.props.className ? ' ' + this.props.className : '')
    );
  }

  onCheckBoxToggled(event: any) {
    this.props.onChange(event.currentTarget.checked, this.props.value);
  }

}
