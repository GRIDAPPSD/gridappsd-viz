import * as React from 'react';

import { IdContextProvider } from './RadioButtonGroup';
import { Ripple } from '@shared/ripple';

import './RadioButton.light.scss';
import './RadioButton.dark.scss';

interface Props {
  selected?: boolean;
  label: string;
  onSelect: () => void;
}

interface State {
}

export class RadioButton extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
    };

  }

  render() {
    return (
      <IdContextProvider.Consumer>
        {
          id =>
            <div
              className='radio-button'>
              <input
                type='radio'
                className='radio-button__input'
                name={id}
                id={this.props.label}
                checked={this.props.selected}
                onChange={this.props.onSelect} />
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
        }
      </IdContextProvider.Consumer>
    );
  }

}
