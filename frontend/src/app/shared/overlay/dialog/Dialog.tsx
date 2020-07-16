import * as React from 'react';

import { PortalRenderer } from '@shared/overlay/portal-renderer';
import { Backdrop } from '@shared/overlay/backdrop';

import './Dialog.light.scss';
import './Dialog.dark.scss';

interface Props {
  show: boolean;
  top?: number;
  left?: number;
  className?: string;
  transparentBackdrop?: boolean;
  onAfterClosed?: () => void;
  onBackdropClicked?: () => void;
}

interface State {
}

export class Dialog extends React.Component<Props, State> {

  readonly dialogRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.onAnimationEnd = this.onAnimationEnd.bind(this);
  }

  componentDidMount() {
    if (this.props.show) {
      this.dialogRef.current.parentElement.classList.add('active');
      this._shiftIntoViewIfOverflowScreen();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.show) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (this.props.children !== (prevProps as any).children) {
        this.dialogRef.current.style.top = `${this.props.top}px`;
      }
      this.dialogRef.current.parentElement.classList.add('active');
      this._shiftIntoViewIfOverflowScreen();
    }
  }

  private _shiftIntoViewIfOverflowScreen() {
    const popupElementBottomEdge = this.dialogRef.current.clientHeight + this.dialogRef.current.offsetTop;
    if (popupElementBottomEdge > document.body.clientHeight) {
      const overflowingHeight = popupElementBottomEdge - document.body.clientHeight;
      this.dialogRef.current.style.top = `${Math.max(this.dialogRef.current.offsetTop - overflowingHeight, 0)}px`;
    }
  }

  render() {
    return (
      <PortalRenderer containerClassName={
        `dialog-container${this.props.top === undefined || this.props.left === undefined ? ' centered' : ''}`
      }>
        <Backdrop
          visible={true}
          transparent={this.props.transparentBackdrop}
          onClick={this.props.onBackdropClicked} />
        <div
          ref={this.dialogRef}
          className={
            `dialog ${this.props.show ? 'dialog--entering' : 'dialog--leaving'}${this.props.className ? ' ' + this.props.className : ''}`
          }
          style={{
            left: this.props.left === 0 ? undefined : this.props.left,
            top: this.props.top === 0 ? undefined : this.props.top
          }}
          onAnimationEnd={this.onAnimationEnd}>
          {this.props.children}
        </div>
      </PortalRenderer>
    );
  }

  onAnimationEnd() {
    if (!this.props.show) {
      this.props.onAfterClosed?.();
      if (this.dialogRef.current) {
        this.dialogRef.current.parentElement.classList.remove('active');
      }
    }
  }

}
