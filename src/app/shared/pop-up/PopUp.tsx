import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './PopUp.scss';

interface Props {
  in: boolean;
  afterClosed?: (data: any) => void;
}

interface State {
}

export class PopUp extends React.Component<Props, State> {

  private _popupElement: HTMLElement;

  componentDidMount() {
    this._popupElement = ReactDOM.findDOMNode(this) as HTMLElement;
    this._popupElement.addEventListener('transitionend', this.props.afterClosed, false);
    this._popupElement.classList.add('pop-up', 'pop-up--leave');
    this.componentWillReceiveProps(this.props);
    this._shiftIntoViewIfOverflowScreen();
  }

  componentDidUpdate() {
    this._shiftIntoViewIfOverflowScreen();
  }

  private _shiftIntoViewIfOverflowScreen() {
    const popupRect = this._popupElement.getBoundingClientRect();

    if (popupRect.bottom > document.body.clientHeight) {
      // 77 is the magic number figured out by using the Inspector
      const topPositionToShiftTo = popupRect.top - (popupRect.bottom - document.body.clientHeight) - 77;
      this._popupElement.style.top = `${topPositionToShiftTo > 5 ? topPositionToShiftTo : 0}px`;
    }
  }

  componentWillUnmount() {
    this._popupElement.removeEventListener('transitionend', this.props.afterClosed, false);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.in) {
      this._popupElement.classList.remove('pop-up--leave');
      this._popupElement.classList.add('pop-up--enter');
    }
    else {
      this._popupElement.classList.remove('pop-up--enter');
      this._popupElement.classList.add('pop-up--leave');
    }
  }

  render() {
    return (this.props.children);
  }

}
