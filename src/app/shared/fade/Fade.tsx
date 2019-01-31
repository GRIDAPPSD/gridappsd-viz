import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './Fade.scss';

interface Props {
  fadeIn: boolean;
}

interface State {
}

export class Fade extends React.Component<Props, State> {
  private _element: HTMLElement;
  private _magic = -1;

  constructor(props: any) {
    super(props);
    this._magic++;
  }

  componentDidMount() {
    this._element = ReactDOM.findDOMNode(this) as HTMLElement;
    if (this.props.fadeIn)
      this._element.classList.add('fade-in');
    this._magic++;
  }

  componentWillReceiveProps(newProps: Props) {
    if (this._magic === 0) {
      this._magic++;
      return;
    }
    if (newProps.fadeIn) {
      this._element.classList.remove('fade-out');
      this._element.classList.add('fade-in');
    }
    else {
      this._element.classList.remove('fade-in');
      this._element.classList.add('fade-out');
    }
  }

  render() {
    return (
      this.props.children
    );
  }
}