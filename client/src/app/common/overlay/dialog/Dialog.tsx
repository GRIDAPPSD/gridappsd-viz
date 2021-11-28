import { Component, createRef } from 'react';
import { Subject } from 'rxjs';

import { PortalRenderer } from '@client:common/overlay/portal-renderer';
import { Backdrop } from '@client:common/overlay/backdrop';
import { BasicButton } from '@client:common/buttons';

import { DialogContent } from './DialogContent';
import { DialogActionGroup } from './DialogActionGroup';

import './Dialog.light.scss';
import './Dialog.dark.scss';

interface Props {
  open: boolean;
  top?: number;
  left?: number;
  className?: string;
  transparentBackdrop?: boolean;
  onAfterClosed?: () => void;
  onBackdropClicked?: () => void;
}

interface State {
  open: boolean;
}

export class Dialog extends Component<Props, State> {

  readonly dialogRef = createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = {
      open: props.open
    };

    this.onAnimationEnd = this.onAnimationEnd.bind(this);
  }

  static create(content: React.ReactNode) {
    return new DialogBuilder(content);
  }

  componentDidMount() {
    if (this.state.open) {
      this.dialogRef.current.parentElement.classList.add('active');
      this._shiftIntoViewIfOverflowScreen();
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.open !== prevProps.open) {
      this.setState({
        open: this.props.open
      });
      if (this.props.open) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (this.props.children !== (prevProps as any).children) {
          this.dialogRef.current.style.top = `${this.props.top}px`;
        }
        this.dialogRef.current.parentElement.classList.add('active');
        this._shiftIntoViewIfOverflowScreen();
      }
    }
  }

  private _shiftIntoViewIfOverflowScreen() {
    const dialogElement = this.dialogRef.current;

    const popupElementBottomEdge = dialogElement.clientHeight + dialogElement.offsetTop;
    if (popupElementBottomEdge > document.body.clientHeight) {
      const overflowingHeight = popupElementBottomEdge - document.body.clientHeight;
      dialogElement.style.top = `${Math.max(dialogElement.offsetTop - overflowingHeight, 0)}px`;
    }
    const overflowingWidth = this.props.left + dialogElement.clientWidth - document.body.clientWidth;
    if (overflowingWidth > 0) {
      dialogElement.style.left = `${this.props.left - overflowingWidth - 5}px`;
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
            `dialog ${this.state.open ? 'dialog--entering' : 'dialog--leaving'}${this.props.className ? ' ' + this.props.className : ''}`
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
    if (!this.state.open) {
      this.props.onAfterClosed?.();
      if (this.dialogRef.current) {
        this.dialogRef.current.parentElement.classList.remove('active');
      }
    }
  }

  close() {
    this.setState({
      open: false
    });
  }
}

type Button = {
  label: string;
  onClick: () => void;
};

export class DialogBuilder {

  private readonly _classNames: string[] = [];

  private _negativeButton: Button;
  private _positiveButton: Button;
  private _isDismissible = false;
  private _transparentBackdrop = false;

  constructor(private readonly _content: React.ReactNode) {

  }

  addNegativeButton(label: string, onClick?: () => void) {
    this._negativeButton = {
      label,
      onClick
    };
    return this;
  }

  addPositiveButton(label: string, onClick: () => void) {
    this._positiveButton = {
      label,
      onClick
    };
    return this;
  }

  addClassName(value: string) {
    this._classNames.push(value);
    return this;
  }

  dismissible() {
    this._isDismissible = true;
    return this;
  }

  transparentBackdrop() {
    this._transparentBackdrop = true;
    return this;
  }

  open(left?: number, top?: number) {
    const dialogRef = createRef<Dialog>();
    const portalRenderer = new PortalRenderer();
    const afterClosed = new Subject<void>();

    portalRenderer.mount(
      <Dialog
        open
        ref={dialogRef}
        className={this._classNames.join(' ')}
        left={left}
        top={top}
        transparentBackdrop={this._transparentBackdrop}
        onAfterClosed={() => {
          portalRenderer.unmount();
          afterClosed.next();
          afterClosed.complete();
        }}
        onBackdropClicked={() => {
          if (this._isDismissible || !this._negativeButton) {
            dialogRef.current.close();
          }
        }}>
        <DialogContent>
          {this._content}
        </DialogContent>
        <DialogActionGroup>
          {
            this._negativeButton
            &&
            <BasicButton
              label={this._negativeButton.label}
              type='negative'
              onClick={() => {
                dialogRef.current.close();
                this._negativeButton.onClick?.();
              }} />
          }
          {
            this._positiveButton
            &&
            <BasicButton
              label={this._positiveButton.label}
              type='positive'
              onClick={() => {
                dialogRef.current.close();
                this._positiveButton.onClick();
              }} />
          }
        </DialogActionGroup>
      </Dialog>
    );

    return new (class DialogRef {
      afterClosed() {
        return afterClosed.asObservable();
      }
    })();
  }

}
