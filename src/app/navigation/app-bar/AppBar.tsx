import * as React from 'react';

import './AppBar.styles.scss';

export class ToolBar extends React.Component<{}, {}> {

  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <nav className='tool-bar'>
        {this.props.children}
      </nav>
    );
  }
}