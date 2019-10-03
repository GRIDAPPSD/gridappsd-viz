import * as React from 'react';
import { findDOMNode } from 'react-dom';

import './Ripple.scss';

interface Props {
  fixed?: boolean;
  color?: string;
}

export class Ripple extends React.Component<Props, {}> {

  private static readonly __RIPPLE_DURATION__ = 2000;

  private _rippleTrigger: HTMLElement = null;

  constructor(props: any) {
    super(props);
    this._showRipple = this._showRipple.bind(this);
  }

  componentDidMount() {
    this._rippleTrigger = findDOMNode(this) as HTMLElement;
    this._rippleTrigger.addEventListener('mousedown', this._showRipple, false);
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
    const rect = this._rippleTrigger.getBoundingClientRect();
    const rippleContainer = document.createElement('div');
    rippleContainer.className = 'ripple';
    rippleContainer.style.borderRadius = getComputedStyle(this._rippleTrigger, null).borderRadius;
    const rippler = document.createElement('span');
    const largerDimension = Math.max(rect.width, rect.height);
    if (this.props.fixed)
      rippleContainer.setAttribute('style', 'display:inline-flex;justify-content:center;align-items:center;');
    else {
      const x = event.clientX - rect.left - largerDimension / 2;
      const y = event.clientY - rect.top - largerDimension / 2;
      rippler.setAttribute('style', `left:${x}px;top:${y}px;`);
    }
    rippler.style.width = largerDimension + 'px';
    rippler.style.height = largerDimension + 'px';
    rippler.style.animationDuration = `${Ripple.__RIPPLE_DURATION__}ms`;
    rippler.style.backgroundColor = this.props.color || 'rgba(0, 0, 0, 0.1)';
    rippleContainer.appendChild(rippler);
    this._rippleTrigger.appendChild(rippleContainer);
    setTimeout(() => this._rippleTrigger.removeChild(rippleContainer), Ripple.__RIPPLE_DURATION__);
  }

}
