import { Component, createRef } from 'react';
import * as ReactDOM from 'react-dom';

import './Tooltip.light.scss';
import './Tooltip.dark.scss';

interface Props {
  position?: 'top' | 'left' | 'right' | 'bottom';
  content: React.ReactChild;
  anchor?: HTMLElement;
}

interface State {
}

export class Tooltip extends Component<Props, State> {

  static defaultProps = {
    position: 'bottom'
  };

  readonly tooltipRef = createRef<HTMLDivElement>();

  private _tooltipContainer: HTMLElement;
  private _tooltipRect: ClientRect;
  private _anchor: Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _timer: any;

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
    // eslint-disable-next-line react/no-find-dom-node
    this._anchor = this.props.anchor || ReactDOM.findDOMNode(this) as HTMLElement;
    if (this._anchor) {
      this._anchor.addEventListener('mouseover', this.show, false);
      this._anchor.addEventListener('click', this.hide, false);
      this._anchor.addEventListener('mouseout', this.hide, false);
    }
  }

  componentWillUnmount() {
    if (this._anchor) {
      this._anchor.removeEventListener('mouseover', this.show, false);
      this._anchor.removeEventListener('click', this.hide, false);
      this._anchor.removeEventListener('mouseout', this.hide, false);
      this.hide();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.content !== this.props.content) {
      this._updateTooltipContent();
    }
  }

  private _updateTooltipContent() {
    if (this.tooltipRef.current) {
      this.tooltipRef.current.querySelector('.td-tooltip__content').textContent = String(this.props.content);
    }
  }

  render() {
    return this.props.children;
  }

  hide() {
    clearTimeout(this._timer);
    if (this.tooltipRef.current) {
      this.tooltipRef.current.classList.add('fade-out');
      this.tooltipRef.current.addEventListener('animationend', this._cleanup, false);
    }
  }

  private _cleanup() {
    this.tooltipRef.current.removeEventListener('animationend', this._cleanup, false);
    this._tooltipContainer.parentElement.removeChild(this._tooltipContainer);
    ReactDOM.unmountComponentAtNode(this._tooltipContainer);
    this._tooltipContainer = null;
  }

  show() {
    this._timer = setTimeout(() => {
      if (!this._tooltipContainer) {
        this._addTooltip(this._createDefaultTooltipContainer());
        this._show();
      }
    }, 250);
  }

  showAt(anchor: Element, container?: HTMLElement) {
    this._timer = setTimeout(() => {
      this._addTooltip(container || this._createDefaultTooltipContainer());
      this._anchor = anchor;
      this._show();
    }, 250);
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
        className={`td-tooltip ${this.props.position}`}
        ref={this.tooltipRef}>
        <div className='td-tooltip__arrow' />
        <div className='td-tooltip__content'>{this.props.content}</div>
      </div>,
      container
    );
  }

  private _show() {
    // Wrap in a setTimeout because React might not have set this._tooltip to
    // the DOM element yet
    setTimeout(() => {
      this.tooltipRef.current.classList.add('fade-in');
      this._tooltipRect = this.tooltipRef.current.getBoundingClientRect();
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
        this.tooltipRef.current.classList.remove('top');
        this.tooltipRef.current.classList.add('bottom');
        top = top + originRect.height + this._tooltipRect.height + 25;
      }
      if (!this._shiftTooltipIntoViewFromRight(left)) {
        this._shiftTooltipIntoViewFromLeft(left);
      }
      this.tooltipRef.current.style.left = left + 'px';
      this.tooltipRef.current.style.top = top + 'px';
    }, 0);
  }

  /**
   * Returns true if tooltip overflows the right edge of the screen, false otherwise
   */
  private _shiftTooltipIntoViewFromRight(left: number) {
    const difference = left + this._tooltipRect.width - document.body.clientWidth + 5;
    if (difference > 5) {
      this.tooltipRef.current.style.transform = `translateX(-${difference}px)`;
      (this.tooltipRef.current.querySelector('.td-tooltip__arrow') as HTMLElement).style.left = `calc(50% + ${difference}px)`;
      return true;
    }
    return false;
  }

  /**
   *
   * Returns true if tooltip overflows the left edge of the screen, false otherwise
   */
  private _shiftTooltipIntoViewFromLeft(left: number) {
    if (left < 0) {
      left = Math.abs(left) + 5;
      this.tooltipRef.current.style.transform = `translateX(${left}px)`;
      (this.tooltipRef.current.querySelector('.td-tooltip__arrow') as HTMLElement).style.left = `calc(50% - ${left}px)`;
      return true;
    }
    return false;
  }

  private _showBottom(originRect: ClientRect) {
    setTimeout(() => {
      const left = originRect.left + (originRect.width - this._tooltipRect.width) / 2;
      let top = originRect.top + originRect.height + 15;
      if (top + this._tooltipRect.height + 10 > document.body.clientHeight) {
        this.tooltipRef.current.classList.remove('bottom');
        this.tooltipRef.current.classList.add('top');
        top = top - originRect.height - this._tooltipRect.height - 30;
      }
      if (!this._shiftTooltipIntoViewFromRight(left)) {
        this._shiftTooltipIntoViewFromLeft(left);
      }
      this.tooltipRef.current.style.left = left + 'px';
      this.tooltipRef.current.style.top = top + 'px';
    }, 0);
  }

  private _showRight(originRect: ClientRect) {
    setTimeout(() => {
      let left = originRect.left + originRect.width + 15;
      const top = originRect.top + (originRect.height - this._tooltipRect.height) / 2;
      if (left + this._tooltipRect.width > document.body.clientWidth) {
        this.tooltipRef.current.classList.remove('right');
        this.tooltipRef.current.classList.add('left');
        left = left - originRect.width - this._tooltipRect.width - 30;
      }
      if (!this._shiftTooltipIntoViewFromBottom(top)) {
        this._shiftTooltipIntoViewFromTop(top);
      }
      this.tooltipRef.current.style.left = left + 'px';
      this.tooltipRef.current.style.top = top + 'px';
    }, 0);
  }

  /**
   *
   * Returns true if tooltip overflows the bottom edge of the screen, false otherwise
   */
  private _shiftTooltipIntoViewFromBottom(top: number) {
    const difference = top + this._tooltipRect.height - document.body.clientHeight + 5;
    if (difference > 5) {
      this.tooltipRef.current.style.transform = `translateY(-${difference}px)`;
      (this.tooltipRef.current.querySelector('.td-tooltip__arrow') as HTMLElement).style.top = `calc(50% + ${difference}px)`;
      return true;
    }
    return false;
  }

  /**
   *
   * Returns true if tooltip overflows the bottom top of the screen, false otherwise
   */
  private _shiftTooltipIntoViewFromTop(top: number) {
    if (top < 0) {
      top = Math.abs(top) + 5;
      this.tooltipRef.current.style.transform = `translateY(${top}px)`;
      (this.tooltipRef.current.querySelector('.td-tooltip__arrow') as HTMLElement).style.top = `calc(50% - ${top}px)`;
      return true;
    }
    return false;
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
        this.tooltipRef.current.classList.remove('left');
        this.tooltipRef.current.classList.add('right');
        left = left + originRect.width + this._tooltipRect.width + 30;
      }
      if (!this._shiftTooltipIntoViewFromBottom(top)) {
        this._shiftTooltipIntoViewFromTop(top);
      }
      this.tooltipRef.current.style.left = left + 'px';
      this.tooltipRef.current.style.top = top + 'px';
    }, 0);
  }

}

let tooltip: Tooltip;

export function showTooltipAt(anchor: Element, content: React.ReactChild, position: 'top' | 'left' | 'right' | 'bottom' = 'bottom') {
  tooltip?.hide();
  tooltip = new Tooltip({ content, position });
  tooltip.showAt(anchor);
}

export function hideTooltip() {
  tooltip?.hide();
  tooltip = null;
}
