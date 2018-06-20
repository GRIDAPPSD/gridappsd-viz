import * as React from 'react';

import { MenuItem } from './MenuItem';
import './DropdownMenu.styles.scss';

interface Props {
  menuItems: MenuItem[];
  onChange: (menuItem: MenuItem) => void;
  onOpen?: () => void;
  defaultItemIndex?: number;
  defaultLabel?: string;
  reset?: boolean;
}

interface State {
  currentLabel: string;
  expanded: boolean;
}

export class DropdownMenu extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      currentLabel: this.props.defaultLabel || 'Select an item',
      expanded: false
    };
    this._onOpen = this._onOpen.bind(this);
    this._onClose = this._onClose.bind(this);
  }
  render() {
    return (
      <div className={'app-dropdown-menu' + (this.state.expanded ? ' expanded' : '')}>
        <a
          href='javascript:void(0)'
          className='app-dropdown-menu-toggler'
          title={this.state.currentLabel}
          onBlur={this._onClose}
          tabIndex={0}
          onFocus={this._onOpen}>
          <span className='text'>{this.state.currentLabel}</span>
          <i className='app-icon'></i>
        </a>

        <ul className='app-dropdown-menu-item-list'>
          {
            this.props.menuItems.map((menuItem, i) =>
              <li
                key={i}
                className='app-dropdown-menu-item'
                onClick={() => this._onChange(menuItem)}>
                <span className="text">{menuItem.label}</span>
              </li>
            )
          }
        </ul>
      </div>
    )
  };
  componentDidMount() {
    if (this.props.defaultItemIndex < 0 || this.props.defaultItemIndex >= this.props.menuItems.length)
      throw new Error('Default item index must be between 0 and ' + (this.props.menuItems.length - 1));
    if (this.props.defaultItemIndex !== undefined)
      this._onChange(this.props.menuItems[this.props.defaultItemIndex]);
  }
  
  componentWillReceiveProps(newProps: Props) {
    if (newProps.reset)
      this.setState({ currentLabel: this.props.defaultLabel || 'Select an item' });
  }
  private _onOpen() {
    if (this.props.onOpen)
      this.props.onOpen;
    this.setState({ expanded: true });
  }

  private _onClose() {
    // Wait for the clicked item to fire before collapse or else it won't fire
    setTimeout(() => this.setState({ expanded: false }), 100);
  }

  private _onChange(menuItem: MenuItem) {
    if (this.state.currentLabel !== menuItem.label) {
      this.props.onChange(menuItem);
      this.setState({ currentLabel: menuItem.label });
    }
  }
}