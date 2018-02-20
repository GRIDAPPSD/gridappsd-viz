import * as React from 'react';
import './CheckBox.styles.scss';

interface Props {
  label: string;
  uncheckable: boolean;
  name: string;
  onChange?: (elem: HTMLInputElement) => void;
  value: any;
  disabled?: boolean;
  checked: boolean
}

export class CheckBox extends React.Component<Props, {}> {
  private _checkbox: HTMLInputElement;

  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <div className={'checkbox' + (this.props.disabled ? ' disabled' : '')}>
        <input
          ref={elem => this._checkbox = elem}
          type={this.props.uncheckable ? 'checkbox' : 'radio'}
          name={this.props.name}
          checked={this.props.checked}
          value={this.props.value}
          disabled={this.props.disabled}
          onChange={event => this.props.onChange(event.currentTarget)} />
        <i className='app-icon'></i>
        <label>{this.props.label}</label>
      </div>
    );
  }
}