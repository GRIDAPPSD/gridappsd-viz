import * as React from 'react';

import { FormControl } from '../form-control/FormControl';
import { ValidationResult } from '../ValidationResult';

import { ValidationErrorMessages } from '../validation-error-messages/ValidationErrorMessages';

import './Input.scss';

interface Props {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
  validators?: Array<(value: string) => ValidationResult>;
  onValidate?: (isValid: boolean) => void;
}

interface State {
  value: string;
  errorMessages: string[];
}

export class Input extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      value: this.props.value,
      errorMessages: []
    };
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.value !== this.props.value)
      this.setState({
        value: this.props.value
      });
  }

  render() {
    return (
      <FormControl
        className={`input-field${this.props.className ? ' ' + this.props.className : ''}`}
        label={this.props.label}
        hint={this.props.hint}>
        <div>
          <div className='input-field-wrapper'>
            <input
              type={this.props.type || 'text'}
              name={this.props.name}
              className='input-field__input'
              onChange={this.handleChange}
              value={this.state.value} />
            <span className='input-field__ripple-bar' />
          </div>
          <ValidationErrorMessages messages={this.state.errorMessages} />
        </div>
      </FormControl>
    );
  }

  handleChange(event: React.FocusEvent<HTMLInputElement>) {
    const value = (event.target as HTMLInputElement).value;
    this.setState({ value });
    if (this.props.validators) {
      const errorMessages = this.props.validators.map(validator => validator(value))
        .filter(result => !result.isValid)
        .map(result => result.errorMessage);
      this.setState({
        errorMessages: errorMessages
      })
      if (errorMessages.length === 0)
        this.props.onChange(value);
    }
    else
      this.props.onChange(value);
  }

}
