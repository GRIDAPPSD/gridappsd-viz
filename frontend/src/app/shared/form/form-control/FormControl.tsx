import * as React from 'react';

import { FormControlModel } from '../models/FormControlModel';
import { ValidationErrorMessageDisplay } from '../validation';

import './FormControl.light.scss';
import './FormControl.dark.scss';

interface Props<T = any> {
  label: string;
  className: string;
  hint?: string;
  htmlFor?: string;
  formControlModel: FormControlModel<T>;
}

interface State {

}

export class FormControl extends React.Component<Props<any>, State> {

  componentDidMount() {
    this.props.formControlModel.validityChanges()
      .subscribe({
        next: () => this.forceUpdate()
      });
    this.props.formControlModel.onDisableToggled()
      .subscribe({
        next: () => this.forceUpdate()
      });
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
