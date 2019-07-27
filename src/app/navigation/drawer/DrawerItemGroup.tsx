import * as React from 'react';

import { DrawerItemIcon, DrawerItemLabel } from './DrawerItem';

import './DrawerItemGroup.scss';

interface Props {
  header: string;
  icon: 'memory';
}

interface State {
  isExpanded: boolean;
  maxHeight: number;
}

export class DrawerItemGroup extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      isExpanded: false,
      maxHeight: 55
    };

    this.toggle = this.toggle.bind(this);
  }

  render() {
    return (
      <li
        style={{
          maxHeight: this.getMaxHeight()
        }}
        className={`drawer-item drawer-item-group${this.state.isExpanded ? ' expanded' : ' collapsed'}`}
        onClick={this.toggle}>
        <div className='drawer-item-wrapper'>
          <DrawerItemIcon icon={this.props.icon} />
          <DrawerItemLabel value={this.props.header} />
          <i className={'material-icons drawer-item-group__angle'}>
            keyboard_arrow_down
          </i>
        </div>
        <ul className='drawer-item-group__nested-drawer-items'>
          {this.props.children}
        </ul>
      </li>
    );
  }

  getMaxHeight() {
    return Array.isArray(this.props.children) && this.state.isExpanded ? this.props.children.length * 50 + 55 : 50;
  }

  toggle(event: React.SyntheticEvent) {
    if ((event.target as HTMLElement).classList.contains('drawer-item-group')) {
      event.stopPropagation();
      this.setState(state => ({
        isExpanded: !state.isExpanded
      }));
    }
    // if child DrawerItems are clicked, then let the event propagate
    // then collapse the nested item group list
    else
      this.setState({
        isExpanded: false
      });
  }
}
