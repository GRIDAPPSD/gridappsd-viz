import { Component } from 'react';

import { FormGroupModel } from '../models/FormGroupModel';

import './Form.light.scss';
import './Form.dark.scss';

interface Props {
  className: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formGroupModel?: FormGroupModel<any>;
  onSubmit?: () => void;
}

interface State {
}

export class Form extends Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.onEnterKeyPressed = this.onEnterKeyPressed.bind(this);
  }

  render() {
    return (
      <form
        className={this.props.className}
        onKeyUp={this.onEnterKeyPressed}>
        {this.props.children}
      </form>
    );
  }

  onEnterKeyPressed(event: React.KeyboardEvent) {
    if (event.key === 'Enter' && this.props.formGroupModel?.isValid()) {
      this.props.onSubmit?.();
    }
    event.preventDefault();
  }

}
