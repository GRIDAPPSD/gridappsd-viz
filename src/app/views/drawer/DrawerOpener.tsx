import * as React from 'react';
import './DrawerOpener.styles.scss';

interface Props {
  onClick: () => void;
}
export class DrawerOpener extends React.Component<Props, {}> {

  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <button className="app-icon drawer-opener" onClick={this.props.onClick}></button>
    );
  }
}