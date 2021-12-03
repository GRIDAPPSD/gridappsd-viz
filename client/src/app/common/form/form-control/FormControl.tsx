import { Component } from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormControlModel } from '../models/FormControlModel';
import { ValidationErrorMessageDisplay } from '../validation';

import './FormControl.light.scss';
import './FormControl.dark.scss';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Props<T = any> {
  label: string;
  className: string;
  formControlModel: FormControlModel<T>;
  hint?: string;
  htmlFor?: string;
}

interface State {

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FormControl extends Component<Props<any>, State> {

  private readonly _unsubscriber = new Subject<void>();

  componentDidMount() {
    this.props.formControlModel.validityChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: () => this.forceUpdate()
      });

    this.props.formControlModel.onDisableToggled()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: () => this.forceUpdate()
      });
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  render() {
    return (
      <div className={this.calculateClassNameFromProps()}>
        {
          this.props.label
          &&
          <label
            className='form-control__label'
            htmlFor={this.props.htmlFor}>
            {this.props.label}
            &nbsp;
            <span className='form-control__label__hint'>
              {this.props.hint}
            </span>
          </label>
        }
        <div className='form-control__body'>
          {this.props.children}
          {
            !this.props.formControlModel.isPristine()
            &&
            <ValidationErrorMessageDisplay messages={this.props.formControlModel.errors} />
          }
        </div>
      </div>
    );
  }

  calculateClassNameFromProps() {
    return `form-control ${this.props.className}`
      + (this.props.formControlModel.isDisabled() ? ' disabled' : '')
      + (this.props.formControlModel.isInvalid() && !this.props.formControlModel.isPristine() ? ' invalid' : '');
  }

}
