import * as React from 'react';

import { Ripple } from '@shared/ripple';
import { FormControlModel } from '../models/FormControlModel';

import './SlideToggle.light.scss';
import './SlideToggle.dark.scss';

interface Props {
  formControlModel: FormControlModel<boolean>;
  className?: string;
  onText?: string;
  offText?: string;
  isOn?: boolean;
  direction?: 'horizontal' | 'vertical';
}

interface State {
  isOn: boolean;
}

export class SlideToggle extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      isOn: props.isOn
    };

    this.toggle = this.toggle.bind(this);

  }

  render() {
    return (
      <div className={this.resolveClassNames()}>
        <div className='slide-toggle__status-text off-text'>
          {this.props.offText}
        </div>
        <div
          className='slide-toggle__slider-container'
          onClick={this.toggle}>
          <Ripple
            fixed
            duration={1000}>
            <div className='slide-toggle__thumb-container'>
              <button
                type='button'
                className='slide-toggle__thumb' />
            </div>
          </Ripple>
        </div>
        <div className='slide-toggle__status-text on-text'>
          {this.props.onText}
        </div>
      </div>
    );
  }

  resolveClassNames() {
    return (
      'slide-toggle' +
      (this.props.className ? ' ' + this.props.className : '') +
      ' ' +
      (this.props.direction) +
      (this.state.isOn ? ' on' : ' off')
    );
  }

  toggle() {
    this.setState(prevState => {
      const newState = !prevState.isOn;
      this.props.formControlModel.setValue(newState);
      return {
        isOn: newState
      };
    });
  }

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(SlideToggle as any).defaultProps = {
  direction: 'horizontal',
  isOn: false,
  onText: '',
  offText: ''
};
