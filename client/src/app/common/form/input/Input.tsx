import { Component } from 'react';
import { Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';

import { DateTimeService } from '@client:common/DateTimeService';

import { FormControl } from '../form-control/FormControl';
import { FormControlModel } from '../models/FormControlModel';

import './Input.light.scss';
import './Input.dark.scss';

interface Props<T extends 'text' | 'number' | 'datetime' | 'password' = 'text'> {
  label: string;
  formControlModel: T extends 'number' ? FormControlModel<number> : T extends 'datetime' ? FormControlModel<number> : FormControlModel<string>;
  hint?: string;
  className?: string;
  type?: T;
}

interface State {
  value: string;
}

export class Input<T extends 'text' | 'number' | 'datetime' | 'password' = 'text'> extends Component<Props<T>, State> {

  private readonly _valueChanges = new Subject<string>();
  private readonly _dateTimeService = DateTimeService.getInstance();
  private readonly _unsubscriber = new Subject<void>();

  private _internalValue: string | number;

  constructor(props: Props<T>) {
    super(props);

    this.state = {
      value: String(props.formControlModel.getValue())
    };

    this.handleChange = this.handleChange.bind(this);

    this._parseValue = this._parseValue.bind(this);
  }

  componentDidMount() {
    this._valueChanges.pipe(debounceTime(250))
      .pipe(
        map(this._parseValue),
        takeUntil(this._unsubscriber)
      )
      .subscribe({
        next: value => {
          this._internalValue = value;
          // If value is null, then this._parseValue failed to parse value,
          // in that case, we want to use the value currently in the input box instead
          // of the parsed value
          (this.props.formControlModel as FormControlModel<string | number>).setValue(value !== null ? value : this.state.value);
        }
      });
    // In case FormControlModel.setValue was called somewhere else,
    // we want to update the state to reflect the new value in UI
    (this.props.formControlModel as FormControlModel<string | number>).valueChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: value => {
          if (value !== this._internalValue && this.props.formControlModel.isValid()) {
            this._internalValue = value;
            if (this.props.type === 'datetime') {
              this.setState({
                value: this._dateTimeService.format(value)
              });
            } else {
              this.setState({
                value: String(value)
              });
            }
          }
        }
      });
  }

  private _parseValue(value: string) {
    if (value === '') {
      return '';
    }
    if (this.props.type === 'number') {
      return +value;
    }
    if (this.props.type === 'datetime') {
      return this._dateTimeService.parse(value);
    }
    return value;
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      <FormControl
        className={`input-field${this.props.className ? ' ' + this.props.className : ''}`}
        formControlModel={this.props.formControlModel}
        label={this.props.label}
        hint={this.props.type === 'datetime' ? 'YYYY-MM-DD HH:MM:SS' : this.props.hint}>
        <div className='input-field-wrapper'>
          <input
            // Only if this.props.type is "password", then we want to set the input element's type
            // to "password", otherwise, for "datetime", "number", or "text", we want to use "text" instead
            type={this.props.type === 'password' ? 'password' : 'text'}
            className='input-field__input'
            onChange={this.handleChange}
            value={this.state.value} />
          <span className='input-field__ripple-bar' />
        </div>
      </FormControl>
    );
  }

  handleChange(event: React.FocusEvent<HTMLInputElement>) {
    const value = event.target.value;
    this.setState({
      value
    });
    this._valueChanges.next(value);
  }

}
