import * as React from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { FormControl } from '../form-control/FormControl';
import { ValidationErrorMessages, Validator, ValidationResult } from '../validation';

import './Input.scss';

interface Props {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
  validators?: Validator[];
  onValidate?: (isValid: boolean, formControlLabel: string, currentValue: string) => void;
  disabled?: boolean;
}

interface State {
  value: string;
  validationErrors: ValidationResult[];
}

export class Input extends React.Component<Props, State> {

  inputElement: HTMLInputElement;

  private readonly _valueChanges = new Subject<string>();

  constructor(props: Props) {
    super(props);
    this.state = {
      value: this.props.value,
      validationErrors: []
    };
    this.handleChange = this.handleChange.bind(this);
    this._onInputValueChanged = this._onInputValueChanged.bind(this);
  }

  componentDidMount() {
    this._valueChanges.pipe(debounceTime(250))
      .subscribe({
        next: this._onInputValueChanged
      });
  }

  private _onInputValueChanged(value: string) {
    if (this.props.validators) {
      const validationErrors = this.props.validators.map(validator => validator(value))
        .filter(result => !result.isValid);
      this.setState({
        validationErrors
      });
      const isValid = validationErrors.length === 0;
      if (this.props.onValidate)
        this.props.onValidate(isValid, this.props.label, value);
      if (isValid)
        this.props.onChange(value);
    }
    else
      this.props.onChange(value);
  }

  componentWillUnmount() {
    this._valueChanges.complete();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.value !== this.props.value)
      this.setState({
        value: this.props.value,
        validationErrors: this.props.value !== '' ? [] : this.state.validationErrors
      });
  }


  render() {
    return (
      <FormControl
        className={`input-field${this.props.className ? ' ' + this.props.className : ''}`}
        label={this.props.label}
        hint={this.props.hint}
        isInvalid={this.state.validationErrors.length !== 0}
        disabled={this.props.disabled}>
        <div className='input-field-wrapper'>
          <input
            ref={ref => this.inputElement = ref}
            type='text'
            name={this.props.name}
            className='input-field__input'
            onChange={this.handleChange}
            value={this.state.value} />
          <span className='input-field__ripple-bar' />
        </div>
        <ValidationErrorMessages messages={this.state.validationErrors.map(result => result.errorMessage)} />
      </FormControl>
    );
  }

  handleChange(event: React.FocusEvent<HTMLInputElement>) {
    const value = (event.target as HTMLInputElement).value;
    this.setState({ value });
    this._valueChanges.next(value);
  }

}
