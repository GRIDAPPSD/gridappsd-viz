import * as React from 'react';

import { IdContextProvider } from './RadioButtonGroup';
import { Ripple } from '@shared/ripple';
import { FormControlModel } from '../models/FormControlModel';

import './RadioButton.light.scss';
import './RadioButton.dark.scss';

interface Props<T> {
  label: string;
  value: T;
  selected?: boolean;
}

interface State {
}

export class RadioButton<T> extends React.Component<Props<T>, State> {

  formControlModel: FormControlModel<T>;

  constructor(props: Props<T>) {
    super(props);

    this.onChange = this.onChange.bind(this);

  }

  render() {
    return (
      <IdContextProvider.Consumer>
        {
          payload => {
            this.formControlModel = payload.formControlModel;
            return (
              <div
                className='radio-button'>
                <input
                  type='radio'
                  className='radio-button__input'
                  name={payload.id}
                  id={this.props.label}
                  checked={this.props.selected}
                  onChange={this.onChange} />
                <Ripple
                  fixed
                  duration={1500}>
                  <div className='radio-button__circle-container'>
                    <label
                      className='radio-button__circle'
                      htmlFor={this.props.label} />
                  </div>
                </Ripple>
                <label
                  className='radio-button__label'
                  htmlFor={this.props.label}>
                  {this.props.label}
                </label>
              </div>
            );
          }
        }
      </IdContextProvider.Consumer>
    );
  }

  onChange() {
    this.formControlModel.setValue(this.props.value);
  }

}
