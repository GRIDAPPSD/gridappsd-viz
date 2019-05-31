import * as React from 'react';

import { FormControl } from '../form-control/FormControl';

import './Input.scss';

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

export class Input extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      value: this.props.value
    };
    this._handleChange = this._handleChange.bind(this);
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
        <span className='input-field-wrapper'>
          <input
            type={this.props.type || 'text'}
            name={this.props.name}
            className='input-field__input'
            onChange={this._handleChange}
            value={this.state.value} />
          <span className='input-field__ripple-bar' />
        </span>
      </FormControl>
    );
  }

  private _handleChange(event: React.FocusEvent<HTMLInputElement>) {
    const value = (event.target as HTMLInputElement).value;
    this.setState({ value });
    this.props.onChange(value);
  }
}