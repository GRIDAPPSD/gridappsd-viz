import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './Fade.scss';

interface Props {
  in: boolean;
}

interface State {
}

export class Fade extends React.Component<Props, State> {
  private _element: HTMLElement;

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    this._element = ReactDOM.findDOMNode(this) as HTMLElement;
    if (this.props.in)
      this._element.classList.add('fade-in');
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props !== prevProps) {
      if (this.props.in) {
        this._element.classList.remove('fade-out');
        this._element.classList.add('fade-in');
      }
      else {
        this._element.classList.remove('fade-in');
        this._element.classList.add('fade-out');
      }
    }
  }

  render() {
    return (
      this.props.children
    );
  }

}
