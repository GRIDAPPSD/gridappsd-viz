import * as React from 'react';

import './AppBar.styles.scss';

export class AppBar extends React.Component<{}, {}> {

  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <nav className="app-bar">
        {this.props.children}
      </nav>
    );
  }
}