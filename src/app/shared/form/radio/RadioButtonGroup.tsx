import * as React from 'react';
import { findDOMNode } from 'react-dom';

import { FormControl } from '../form-control/FormControl';

import './RadioButtonGroup.scss';

export const IdContextProvider = React.createContext('');

interface Props {
  id: string;
  label: string;
  style?: 'default' | 'switches';
}

interface State {
}

export class RadioButtonGroup extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
    if (this.props.style === 'switches') {
      const radioButtonGroup = findDOMNode(this) as HTMLElement;
      const radioButtons = Array.from(radioButtonGroup.querySelectorAll('.radio-button')) as HTMLElement[];
      const maxWidth = Math.max(...radioButtons.map(e => e.clientWidth));
      for (const e of radioButtons)
        e.setAttribute('style', `width:${maxWidth}px`);
    }
  }

  render() {
    return (
      <FormControl
        className={'radio-button-group style-' + (this.props.style || 'default')}
        label={this.props.label}>
        <div className='radio-button-group__radio-buttons'>
          <IdContextProvider.Provider value={this.props.id}>
            {this.props.children}
          </IdContextProvider.Provider>
        </div>
      </FormControl>
    );
  }

}
