import * as React from 'react';

import { PopUp } from '@shared/pop-up';
import { DrawerItemIcon, DrawerItem, DrawerItemLabel } from './DrawerItem';

import './DrawerItemGroup.scss';

interface Props {
  header: string;
  icon: 'memory';
}

interface State {
  isExpanded: boolean;
}

export class DrawerItemGroup extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      isExpanded: false
    }
    this._collapse = this._collapse.bind(this);
    this._toogle = this._toogle.bind(this);
  }
  render() {
    return (
      <DrawerItem className={'drawer-item-group' + (this.state.isExpanded ? ' expanded' : ' collapsed')}>
        <DrawerItemIcon icon={this.props.icon} />
        <DrawerItemLabel value={this.props.header} />
        <i className={'material-icons drawer-item-group__angle'}>
          keyboard_arrow_right
        </i>
        <PopUp in={this.state.isExpanded}>
          <div className='nested-drawer-items'>
            <div className='nested-drawer-items__arrow' />
            <ul
              className='nested-drawer-items__list'
              onClick={this._collapse}>
              {this.props.children}
            </ul>
          </div>
        </PopUp>
      </DrawerItem>
    );
  }

  private _collapse(event) {
    event.stopPropagation();
    this.setState({ isExpanded: false });
  }

  private _toogle(event: any) {
    event.stopPropagation();
    this.setState((prevState) => ({ isExpanded: !prevState.isExpanded }));
  }
}