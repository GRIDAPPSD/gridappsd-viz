import * as React from 'react';

import { Ripple } from '@shared/ripple';
import { FormControl } from '../form-control/FormControl';
import { FormControlModel } from '../models/FormControlModel';

import './Checkbox.light.scss';
import './Checkbox.dark.scss';

interface Props {
  label: string;
  name: string;
  formControlModel: FormControlModel<boolean>;
  labelPosition?: 'left' | 'right';
  className?: string;
  hint?: string;
}

interface State {
  checked: boolean;
}

export class Checkbox extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      checked: props.formControlModel.getValue()
    };

    this.onCheckBoxToggled = this.onCheckBoxToggled.bind(this);
  }

  componentDidMount() {
    this.props.formControlModel.valueChanges()
      .subscribe({
        next: isChecked => {
          this.setState({
            checked: isChecked
          });
        }
      });
  }

  componentWillUnmount() {
    this.props.formControlModel.cleanup();
  }

  render() {
    return (
      <FormControl
        className={this.resolveClassNames()}
        label={this.props.label}
        htmlFor={this.props.label}
        hint={this.props.hint}
        formControlModel={this.props.formControlModel}>
        <Ripple
          fixed
          duration={1500}>
          <div className='checkbox-wrapper'>
            <input
              className='checkbox__input'
              id={this.props.label}
              type='checkbox'
              name={this.props.name}
              disabled={this.props.formControlModel.isDisabled()}
              checked={this.state.checked}
              onChange={this.onCheckBoxToggled} />
            <i className='material-icons checkbox__icon checkbox__icon__unchecked'>
              check_box_outline_blank
            </i>
            <i className='material-icons checkbox__icon checkbox__icon__checked'>
              check_box
            </i>
          </div>
        </Ripple>
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
    this.props.formControlModel.setValue(event.currentTarget.checked);
  }

}
