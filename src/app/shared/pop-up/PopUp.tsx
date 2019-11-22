import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Backdrop } from '@shared/backdrop';

import './PopUp.light.scss';
import './PopUp.dark.scss';

interface Props {
  top?: number;
  left?: number;
  in: boolean;
  showBackdrop?: boolean;
  onAfterClosed?: () => void;
  onBackdropClicked?: (event: MouseEvent) => void;
}

interface State {
}

export class PopUp extends React.Component<Props, State> {

  readonly popupContainer = document.createElement('div');
  popupElement: HTMLElement;

  constructor(props: Props) {
    super(props);

    this.onAnimationEnd = this.onAnimationEnd.bind(this);
  }

  componentDidMount() {
    this.popupContainer.className = 'pop-up-container';
    if (this.props.top === undefined || this.props.left === undefined)
      this.popupContainer.className += ' centered';
    this.popupContainer.onclick = (event: MouseEvent) => {
      if (event.target === this.popupContainer && this.props.onBackdropClicked)
        this.props.onBackdropClicked(event);
    };
    if (this.props.in) {
      document.body.appendChild(this.popupContainer);
      this._shiftIntoViewIfOverflowScreen();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.in) {
      if (!document.body.contains(this.popupContainer))
        document.body.appendChild(this.popupContainer);
      if (this.props.children !== (prevProps as any).children)
        this.popupElement.style.top = `${this.props.top}px`;
      this._shiftIntoViewIfOverflowScreen();
    }
  }

  private _shiftIntoViewIfOverflowScreen() {
    const popupElementBottomEdge = this.popupElement.clientHeight + this.popupElement.offsetTop;
    if (popupElementBottomEdge > document.body.clientHeight) {
      const overflowingHeight = popupElementBottomEdge - document.body.clientHeight;
      this.popupElement.style.top = `${Math.max(this.popupElement.offsetTop - overflowingHeight, 0)}px`;
    }
  }

  componentWillUnmount() {
    if (document.body.contains(this.popupContainer))
      document.body.removeChild(this.popupContainer);
    this.popupContainer.onclick = null;
  }

  render() {
    return ReactDOM.createPortal(
      <>
        {
          this.props.showBackdrop
          &&
          <Backdrop visible={true} />
        }
        <div
          ref={ref => this.popupElement = ref}
          className={`pop-up ${this.props.in ? 'pop-up--enter' : 'pop-up--leave'}`}
          style={{
            left: this.props.left === 0 ? undefined : this.props.left,
            top: this.props.top === 0 ? undefined : this.props.top
          }}
          onAnimationEnd={this.onAnimationEnd}>
          {this.props.children}
        </div>
      </>,
      this.popupContainer
    );
  }

  onAnimationEnd() {
    if (!this.props.in) {
      if (document.body.contains(this.popupContainer)) {
        document.body.removeChild(this.popupContainer);
      }
      this.props.onAfterClosed?.();
    }
  }

}
