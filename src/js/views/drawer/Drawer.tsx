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
    this.toggleDrawer = this.toggleDrawer.bind(this);
  }
  render() {
    return (
      <div className={'drawer' + (this.state.isOpened ? ' opened' : ' closed')}>
        <div className={'backdrop' + (this.state.isOpened ? ' visible' : ' hidden')} onClick={this.toggleDrawer}></div>
        <ul className="drawer-items" onClick={this.toggleDrawer}>
          {this.props.children}
        </ul>
        <section className="content">
          {this.props.content}
        </section>
      </div>
    );
  }

  toggleDrawer() {
    this.setState({ isOpened: !this.state.isOpened });
  }

  open() {
    this.setState({ isOpened: true });
  }

  close() {
    this.setState({ isOpened: false });
  }
}