import { Component, createContext } from 'react';
import { findDOMNode } from 'react-dom';

import { FormControl } from '../form-control/FormControl';
import { FormControlModel } from '../models/FormControlModel';

import './RadioButtonGroup.light.scss';
import './RadioButtonGroup.dark.scss';

export const IdContextProvider = createContext({
  id: '',
  formControlModel: null
});

interface Props<T> {
  id: string;
  label: string;
  formControlModel: FormControlModel<T>;
  style?: 'default' | 'switches';
}

interface State {
}

export class RadioButtonGroup<T> extends Component<Props<T>, State> {

  componentDidMount() {
    if (this.props.style === 'switches') {
      // eslint-disable-next-line react/no-find-dom-node
      const radioButtonGroup = findDOMNode(this) as HTMLElement;
      const radioButtons = Array.from(radioButtonGroup.querySelectorAll('.radio-button')) as HTMLElement[];
      const maxWidth = Math.max(...radioButtons.map(e => e.clientWidth));
      for (const e of radioButtons) {
        e.setAttribute('style', `width:${maxWidth}px`);
      }
    }
  }

  render() {
    return (
      <FormControl
        className={'radio-button-group style-' + (this.props.style || 'default')}
        formControlModel={this.props.formControlModel}
        label={this.props.label}>
        <div className='radio-button-group__radio-buttons'>
          <IdContextProvider.Provider
            value={{
              id: this.props.id,
              formControlModel: this.props.formControlModel
            }}>
            {this.props.children}
          </IdContextProvider.Provider>
        </div>
      </FormControl>
    );
  }

}
