import * as React from 'react';
import './Drawer.styles.scss';

interface Props {
  content: JSX.Element;
}

interface State {
  isOpened: boolean;
}
export class Drawer extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      isOpened: false
    };
    this.close = this.close.bind(this);
  }
  render() {
    return (
      <div className={'drawer' + (this.state.isOpened ? ' opened' : ' closed')}>
        <div className={'backdrop' + (this.state.isOpened ? ' visible' : ' hidden')} onClick={this.close}></div>
        <ul className="drawer-items" onClick={this.close}>
          {this.props.children}
        </ul>
        <section className="content">
          {this.props.content}
        </section>
      </div>
    );
  }

  open() {
    this.setState({ isOpened: true });
  }
  close() {
    this.setState({ isOpened: false });
  }

}