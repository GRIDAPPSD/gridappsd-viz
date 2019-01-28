import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './PopUp.scss';

interface Props {
  in: boolean;
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
    this._element.classList.add('pop-up', 'pop-up-out');
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.in) {
      this._element.classList.remove('pop-up-out');
      this._element.classList.add('pop-up-in');
    }
    else {
      this._element.classList.remove('pop-up-in');
      this._element.classList.add('pop-up-out');
    }
  }

  render() {
    return (
      this.props.children
    );
  }
}