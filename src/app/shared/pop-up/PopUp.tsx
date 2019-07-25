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
  private _element: HTMLElement;

  constructor(props: any) {
    super(props);

    this.state = {
    };
  }

  componentDidMount() {
    this._element = ReactDOM.findDOMNode(this) as HTMLElement;
    this._element.addEventListener('transitionend', this.props.afterClosed, false);
    this._element.classList.add('pop-up', 'pop-up--leave');
    this.componentWillReceiveProps(this.props);
    this._shiftIntoViewIfOverflowScreen();
  }

  componentDidUpdate() {
    this._shiftIntoViewIfOverflowScreen();
  }

  private _shiftIntoViewIfOverflowScreen() {
    const popupRect = this._element.getBoundingClientRect();

    if (popupRect.bottom > document.body.clientHeight) {
      // 77 is the magic number figured out by using the Inspector
      const topPositionToShiftTo = popupRect.top - (popupRect.bottom - document.body.clientHeight) - 77;
      this._element.style.top = `${topPositionToShiftTo > 5 ? topPositionToShiftTo : 0}px`;
    }
  }

  componentWillUnmount() {
    this._element.removeEventListener('transitionend', this.props.afterClosed, false);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.in) {
      this._element.classList.remove('pop-up--leave');
      this._element.classList.add('pop-up--enter');
    }
    else {
      this._element.classList.remove('pop-up--enter');
      this._element.classList.add('pop-up--leave');
    }
  }

  render() {
    return (this.props.children);
  }

}
