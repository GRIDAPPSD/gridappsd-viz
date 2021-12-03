import { Component } from 'react';

import { IconButton } from '@client:common/buttons';

import { Option } from './Option';

import './SelectedOptionList.light.scss';
import './SelectedOptionList.dark.scss';

interface Props<T> {
  options: Option<T>[];
  onDeselectOption: (option: Option<T>) => void;
}

interface State {
  show: boolean;
}

export class SelectedOptionList<T> extends Component<Props<T>, State> {

  constructor(props: Props<T>) {
    super(props);

    this.state = {
      show: false
    };

    this.toggleOptionList = this.toggleOptionList.bind(this);
  }

  render() {
    return (
      <div className={`selected-option-list-container${this.state.show ? ' open' : ' closed'}`}>
        {
          this.props.options.length > 0
          &&
          <IconButton
            className='show-selected-option-list'
            icon='keyboard_arrow_down'
            style='accent'
            size='small'
            onClick={this.toggleOptionList} />
        }
        <ul className='selected-option-list'>
          {
            this.props.options.map((option, i) => (
              <li
                key={i}
                className='selected-option-list__option'>
                <IconButton
                  className='selected-option-list__option__deselect'
                  icon='close'
                  style='accent'
                  size='small'
                  onClick={() => {
                    this.props.onDeselectOption(option);
                    // Now is empty, close it
                    if (this.props.options.length === 1) {
                      this.toggleOptionList();
                    }
                  }} />
                <div className='selected-option-list__option__label'>
                  {option.label}
                </div>
              </li>
            ))
          }
        </ul>
      </div>
    );
  }

  toggleOptionList() {
    this.setState(state => ({
      show: !state.show
    }));
  }

}
