import * as React from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { FormControl } from '../form-control/FormControl';
import { ValidationErrorMessages, Validator, ValidationResult } from '../validation';

import './TextArea.scss';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  validators?: Validator[];
  disabled?: boolean;
  readonly?: boolean;
  onValidate?: (isValid: boolean, formControlLabel: string) => void;
  hint?: string;
}

interface State {
  validationErrors: ValidationResult[];
}

export class TextArea extends React.Component<Props, State> {

  private readonly _valueChanges = new Subject<string>();

  constructor(props: Props) {
    super(props);
    this.state = {
      validationErrors: []
    };

    this._onInputValueChanged = this._onInputValueChanged.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
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
        this.props.onValidate(isValid, this.props.label);
      if (isValid)
        this.props.onChange(value);
    }
    else
      this.props.onChange(value);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.disabled !== prevProps.disabled)
      this.setState({
        validationErrors: []
      });
  }

  componentWillUnmount() {
    this._valueChanges.complete();
  }

  render() {
    return (
      <FormControl
        className={`textarea${this.props.className ? ` ${this.props.className}` : ''}`}
        label={this.props.label}
        disabled={this.props.disabled}
        isInvalid={this.state.validationErrors.length !== 0}
        hint={this.props.hint}>
        <div
          className='textarea__input-box'
          contentEditable={!this.props.readonly}
          suppressContentEditableWarning
          onKeyUp={this.onKeyUp}>
          {this.props.value}
        </div>
        <ValidationErrorMessages messages={this.state.validationErrors.map(error => error.errorMessage)} />
      </FormControl>
    );
  }

  onKeyUp(event: React.SyntheticEvent) {
    const value = (event.target as HTMLDivElement).textContent;
    this._valueChanges.next(value);
  }

}
