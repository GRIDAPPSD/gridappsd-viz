import * as React from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { FormControl } from '../form-control/FormControl';
import { FormControlModel } from '../models/FormControlModel';
import { DateTimeService } from '@shared/DateTimeService';

import './Input.light.scss';
import './Input.dark.scss';

interface Props<T extends 'text' | 'number' | 'datetime' | 'password' = 'text'> {
  label: string;
  hint?: string;
  className?: string;
  type?: T;
  formControlModel: T extends 'number' ? FormControlModel<number> : T extends 'datetime' ? FormControlModel<number> : FormControlModel<string>;
}

interface State {
  value: string;
}

export class Input<T extends 'text' | 'number' | 'datetime' | 'password' = 'text'> extends React.Component<Props<T>, State> {

  private readonly _valueChanges = new Subject<string>();
  private readonly _dateTimeService = DateTimeService.getInstance();

  constructor(props: Props<T>) {
    super(props);

    this.state = {
      value: String(props.formControlModel.getValue())
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this._valueChanges.pipe(debounceTime(250))
      .subscribe({
        next: value => {
          (this.props.formControlModel as FormControlModel<string | number>).setValue(value);
        }
      });
    // In case FormControlModel.setValue was called somewhere else,
    // we want to update the state to reflect the new value in UI
    (this.props.formControlModel as FormControlModel<string | number>).valueChanges()
      .subscribe({
        next: value => {
          // This is true when this.props.formControlModel.setValue()
          // was called from outside of this component, in that case
          // we want to update this component to reflect the new value
          if (this.state.value !== value && this.props.formControlModel.isValid()) {
            if (this.props.type === 'datetime') {
              if (typeof value === 'string') {
                this.setState({
                  value: this._dateTimeService.format(new Date(value))
                });
              } else if (typeof value === 'number') {
                this.setState({
                  value: this._dateTimeService.format(value)
                });
              }
            } else {
              this.setState({
                value: String(value)
              });
            }
          }
        }
      });
  }

  componentWillUnmount() {
    this._valueChanges.complete();
    this.props.formControlModel.cleanup();
  }

  render() {
    return (
      <FormControl
        className={`input-field${this.props.className ? ' ' + this.props.className : ''}`}
        formControlModel={this.props.formControlModel}
        label={this.props.label}
        hint={this.props.type === 'datetime' ? 'YYY-MM-DD HH:MM:SS' : this.props.hint}>
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
    const value = (event.target as HTMLInputElement).value;
    this.setState({
      value
    });
    this._valueChanges.next(value);
  }

}
