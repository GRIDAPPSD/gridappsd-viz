import { Component } from 'react';
import { findDOMNode } from 'react-dom';

import './Ripple.light.scss';
import './Ripple.dark.scss';

interface Props {
  fixed?: boolean;
  duration?: number;
}

export class Ripple extends Component<Props, unknown> {

  static defaultProps: Props = {
    fixed: false,
    duration: 2000
  };

  private _rippleTrigger: HTMLElement = null;

  constructor(props: Props) {
    super(props);
    this._showRipple = this._showRipple.bind(this);
  }

  componentDidMount() {
    // eslint-disable-next-line react/no-find-dom-node
    this._rippleTrigger = findDOMNode(this) as HTMLElement;
    this._rippleTrigger.addEventListener('mousedown', this._showRipple, false);
    this._rippleTrigger.style.cursor = 'pointer';
  }

  componentWillUnmount() {
    this._rippleTrigger.removeEventListener('mousedown', this._showRipple, false);
  }

  render() {
    return (
      this.props.children
    );
  }

  private _showRipple(event: MouseEvent) {
    const rippleTriggerBoundingBox = this._rippleTrigger.getBoundingClientRect();
    const rippleTriggerComputedStyles = getComputedStyle(this._rippleTrigger, null);
    const rippleTriggerLargerDimension = Math.max(rippleTriggerBoundingBox.width, rippleTriggerBoundingBox.height);
    const ripple = document.createElement('div');
    const rippleEffect = document.createElement('span');

    ripple.className = 'ripple';
    ripple.style.borderRadius = rippleTriggerComputedStyles.borderRadius;

    rippleEffect.className = 'ripple-effect';
    rippleEffect.style.width = rippleTriggerLargerDimension + 'px';
    rippleEffect.style.height = rippleTriggerLargerDimension + 'px';
    rippleEffect.style.animationDuration = `${this.props.duration}ms`;

    if (rippleTriggerComputedStyles.position === 'static') {
      this._rippleTrigger.style.position = 'relative';
    }
    if (this.props.fixed) {
      ripple.className += ' fixed';
    } else {
      const x = event.clientX - rippleTriggerBoundingBox.left - rippleTriggerLargerDimension / 2;
      const y = event.clientY - rippleTriggerBoundingBox.top - rippleTriggerLargerDimension / 2;
      rippleEffect.style.left = x + 'px';
      rippleEffect.style.top = y + 'px';
    }
    ripple.appendChild(rippleEffect);
    this._rippleTrigger.appendChild(ripple);
    setTimeout(() => this._rippleTrigger.removeChild(ripple), this.props.duration);
  }

}
