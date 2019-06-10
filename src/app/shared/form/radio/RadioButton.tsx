import * as React from 'react';

import { IdContextProvider } from './RadioButtonGroup';

import './RadioButton.scss';

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
                checked={this.props.selected}
                onChange={this.props.onSelect} />
              <div className='radio-button__circle' />
              <div className='radio-button__label'>{this.props.label}</div>
            </div>
        }
      </IdContextProvider.Consumer>
    );
  }
}