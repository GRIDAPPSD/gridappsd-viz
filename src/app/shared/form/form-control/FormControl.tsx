import * as React from 'react';

import './FormControl.scss';

interface Props {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
}

interface State {
  value: string;
}

export class FormControl extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      value: this.props.value
    };
    this._handleChange = this._handleChange.bind(this);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.value !== this.props.value)
      this.setState({ value: newProps.value });
  }

  render() {
    return (
      <div className={'gridappsd-form-control' + (this.props.className ? ` ${this.props.className}` : '')}>
        <label className='gridappsd-form-control__label'>
          {this.props.label}
          &nbsp;
      {this.props.hint && <span className='gridappsd-form-control__label__hint'>({this.props.hint})</span>}
        </label>
        <span className='gridappsd-form-control__ripple-input-field'>
          <input
            type={this.props.type || 'text'}
            name={this.props.name}
            className='simulation-name gridappsd-form-control__ripple-input-field__input'
            onChange={this._handleChange}
            value={this.state.value} />
          <span className='gridappsd-form-control__ripple-input-field__ripple-bar' />
        </span>
      </div>
    );
  }

  private _handleChange(event: React.FocusEvent<HTMLInputElement>) {
    const value = (event.target as HTMLInputElement).value;
    this.setState({ value });
    this.props.onChange(value);
  }
}