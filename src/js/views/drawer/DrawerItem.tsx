import * as React from 'react';
import './DrawerItem.styles.scss';

interface Props {
  onClick?: () => void;
  className?: string;
}
export class DrawerItem extends React.Component<Props, {}> {

  constructor(props: any) {
    super(props);
  }
  render() {
    if (!this.props.onClick)
      return (
        <li className={'drawer-item' + (this.props.className ? ' ' + this.props.className : '')}>
          {this.props.children}
        </li>
      );
    return (
      <li
        className={'drawer-item' + (this.props.className ? ' ' + this.props.className : '')}
        onClick={this.props.onClick}>
        {this.props.children}
      </li>
    );
  }

}