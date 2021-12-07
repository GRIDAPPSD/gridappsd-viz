import { Component } from 'react';
import { Subscription } from 'rxjs';

import { Ripple } from '@client:common/ripple';

import { FormControlModel } from '../models/FormControlModel';

import './SlideToggle.light.scss';
import './SlideToggle.dark.scss';

interface Props {
  formControlModel: FormControlModel<boolean>;
  className?: string;
  onText?: string;
  offText?: string;
  direction?: 'horizontal' | 'vertical';
}

interface State {
  isOn: boolean;
}

export class SlideToggle extends Component<Props, State> {

  private _subscription: Subscription;

  constructor(props: Props) {
    super(props);

    this.state = {
      isOn: props.formControlModel.getValue()
    };

    this.toggle = this.toggle.bind(this);

  }

  componentDidMount() {
    this._subscription = this.props.formControlModel.valueChanges()
      .subscribe({
        next: isOn => {
          this.setState({
            isOn
          });
        }
      });
  }

  componentWillUnmount() {
    this._subscription.unsubscribe();
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
    this.props.formControlModel.setValue(!this.props.formControlModel.getValue());
  }

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(SlideToggle as any).defaultProps = {
  direction: 'horizontal',
  onText: '',
  offText: ''
};
