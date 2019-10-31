import * as React from 'react';

import { Ripple } from '@shared/ripple';

import './SlideToggle.light.scss';
import './SlideToggle.dark.scss';

interface Props {
  onChange: (state: boolean) => void;
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

  static defaultProps = {
    direction: 'horizontal',
    isOn: false,
    onText: '',
    offText: ''
  } as Props;

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
        <div className='slide-toggle__slider-container'>
          <Ripple
            fixed
            duration={1000}>
            <div className='slide-toggle__thumb-container'>
              <button
                type='button'
                className='slide-toggle__thumb'
                onClick={this.toggle} />
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
      this.props.onChange(newState);
      return {
        isOn: newState
      };
    });
  }

}
