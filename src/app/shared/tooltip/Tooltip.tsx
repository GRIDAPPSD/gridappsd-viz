import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './Tooltip.scss';

interface Props {
  position?: 'top' | 'left' | 'right' | 'bottom';
  content: string | React.ReactElement<any>;
  anchor?: HTMLElement;
}

interface State {
}

export class Tooltip extends React.Component<Props, State> {

  static defaultProps = {
    position: 'bottom'
  };

  private _tooltip: HTMLElement;
  private _tooltipContainer: HTMLElement;
  private _tooltipRect: ClientRect;
  private _anchor: HTMLElement;

  constructor(props: Props) {
    super(props);
    this.state = {
    };
    this._anchor = props.anchor;

    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this._cleanup = this._cleanup.bind(this);
  }

  componentDidMount() {
    this._anchor = this.props.anchor || ReactDOM.findDOMNode(this) as HTMLElement;
    if (this._anchor) {
      this._anchor.addEventListener('mouseover', this.show, false);
      this._anchor.addEventListener('mouseout', this.hide, false);
    }
  }

  componentWillUnmount() {
    if (this._anchor) {
      this._anchor.removeEventListener('mouseover', this.show, false);
      this._anchor.removeEventListener('mouseout', this.hide, false);
      this.hide();
    }
  }

  render() {
    return this.props.children;
  }

  hide() {
    if (this._tooltip) {
      this._tooltip.classList.add('fade-out');
      this._tooltip.addEventListener('animationend', this._cleanup, false);
    }
  }

  private _cleanup() {
    this._tooltip.removeEventListener('animationend', this._cleanup, false);
    this._tooltipContainer.parentElement.removeChild(this._tooltipContainer);
    ReactDOM.unmountComponentAtNode(this._tooltipContainer);
    this._tooltipContainer = null;
  }

  show() {
    if (!this._tooltipContainer) {
      this._addTooltip(this._createDefaultTooltipContainer());
      this._show();
    }
  }

  showAt(anchor: HTMLElement, container?: HTMLElement) {
    this._addTooltip(container || this._createDefaultTooltipContainer());
    this._anchor = anchor;
    this._show();
  }

  private _createDefaultTooltipContainer(): HTMLElement {
    this._tooltipContainer = document.createElement('div');
    this._tooltipContainer.classList.add('tooltip-container');
    document.body.appendChild(this._tooltipContainer);
    return this._tooltipContainer;
  }

  private _addTooltip(container: HTMLElement) {
    this._tooltipContainer = container;
    ReactDOM.render(
      <div
        className={`gridappsd-tooltip ${this.props.position}`}
        ref={elem => this._tooltip = elem}>
        <div className='gridappsd-tooltip__arrow' />
        <div className='gridappsd-tooltip__content'>{this.props.content}</div>
      </div>,
      container
    );
  }

  private _show() {
    // Wrap in a setTimeout because React might not have set this._tooltip to
    // the DOM element yet
    setTimeout(() => {
      this._tooltip.classList.add('fade-in');
      this._tooltipRect = this._tooltip.getBoundingClientRect();
      switch (this.props.position) {
        case 'top':
          this._showTop(this._anchor.getBoundingClientRect());
          break;
        case 'right':
          this._showRight(this._anchor.getBoundingClientRect());
          break;
        case 'bottom':
          this._showBottom(this._anchor.getBoundingClientRect());
          break;
        case 'left':
          this._showLeft(this._anchor.getBoundingClientRect());
          break;
      }
    }, 0);
  }

  private _showTop(originRect: ClientRect) {
    setTimeout(() => {
      const left = originRect.left + (originRect.width - this._tooltipRect.width) / 2;
      let top = originRect.top - originRect.height;
      if (top < 0) {
        this._tooltip.classList.remove('top');
        this._tooltip.classList.add('bottom');
        top = top + originRect.height + this._tooltipRect.height + 25;
      }
      this._tooltip.style.left = left + 'px';
      this._tooltip.style.top = top + 'px';
    }, 0);

  }

  private _showRight(originRect: ClientRect) {
    setTimeout(() => {
      let left = originRect.left + originRect.width + 15;
      const top = originRect.top + (originRect.height - this._tooltipRect.height) / 2;
      if (left + this._tooltipRect.width > document.body.clientWidth) {
        this._tooltip.classList.remove('right');
        this._tooltip.classList.add('left');
        left = left - originRect.width - this._tooltipRect.width - 30;
      }
      this._tooltip.style.left = left + 'px';
      this._tooltip.style.top = top + 'px';
    }, 0);
  }

  private _showBottom(originRect: ClientRect) {
    setTimeout(() => {
      const left = originRect.left + (originRect.width - this._tooltipRect.width) / 2;
      let top = originRect.top + originRect.height + 15;
      if (top + this._tooltipRect.height + 10 > document.body.clientHeight) {
        this._tooltip.classList.remove('bottom');
        this._tooltip.classList.add('top');
        top = top - originRect.height - this._tooltipRect.height - 30;
      }
      this._tooltip.style.left = left + 'px';
      this._tooltip.style.top = top + 'px';
    }, 0);

  }

  private _showLeft(originRect: ClientRect) {
    /*
      Wrap this in a setTimeout because tooltip is animated, so by the time getBoundingClientRect()
      is called, tooltip component might not be visible yet, so it can't calculate tooltip's client rect
    */
    setTimeout(() => {
      let left = originRect.left - this._tooltipRect.width - 15;
      const top = originRect.top + (originRect.height - this._tooltipRect.height) / 2;
      if (left < 0) {
        this._tooltip.classList.remove('left');
        this._tooltip.classList.add('right');
        left = left + originRect.width + this._tooltipRect.width + 30;
      }
      this._tooltip.style.left = left + 'px';
      this._tooltip.style.top = top + 'px';
    }, 0);

  }

}