import * as React from 'react';
import { findDOMNode } from 'react-dom';

import './Ripple.scss';

interface Props {
  fixed?: boolean;
}

export class Ripple extends React.Component<Props, {}> {
  private _rippleTrigger: HTMLElement = null;
  private static readonly __RIPPLE_DURATION__ = 1500;

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

  private _showRipple(event) {
    const rect = this._rippleTrigger.getBoundingClientRect();
    const rippleContainer = document.createElement('div');
    rippleContainer.className = 'ripple';
    const rippler = document.createElement('span');
    const largerDimension = Math.max(rect.width, rect.height);
    if (this.props.fixed) {
      rippler.style.left = '0';
      rippler.style.top = '0';
    }
    else {
      const x = event.clientX - rect.left - largerDimension / 2;
      const y = event.clientY - rect.top - largerDimension / 2;
      rippler.style.left = x + 'px';
      rippler.style.top = y + 'px';
    }
    rippleContainer.style.width = rect.width + 'px';
    rippleContainer.style.height = rect.height + 'px';
    rippler.style.width = largerDimension + 'px';
    rippler.style.height = largerDimension + 'px';
    rippler.style.animationDuration = `${Ripple.__RIPPLE_DURATION__}ms`;
    rippleContainer.appendChild(rippler);
    this._rippleTrigger.appendChild(rippleContainer);
    setTimeout(() => this._rippleTrigger.removeChild(rippleContainer), Ripple.__RIPPLE_DURATION__);
  }
}