import * as React from 'react';
import { MenuItem } from './MenuItem';
import './DropDownMenu.styles.scss';

interface Props {
  menuItems: MenuItem[];
  onMenuItemClick: (menuItem: MenuItem) => void;
  onOpen?: () => void;
  defaultItemIndex?: number;
  defaultLabel?: string;
  reset: boolean;
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
    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
  }
  render() {
    return (
      <div className={'app-dropdown-menu' + (this.state.expanded ? ' expanded' : '')}>
        <a
          href='javascript:void(0)'
          className='app-dropdown-menu-toggler'
          title={this.state.currentLabel}
          onBlur={this.onClose}
          onFocus={this.onOpen}>
          <span className='text'>{this.state.currentLabel}</span>
          <i className='app-icon'></i>
        </a>

        <ul className='app-dropdown-menu-item-list'>
          {
            this.props.menuItems.map(menuItem =>
              <li
                key={menuItem.id}
                className='app-dropdown-menu-item'
                onClick={() => this.onMenuItemClicked(menuItem)}>
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
      this.onMenuItemClicked(this.props.menuItems[this.props.defaultItemIndex]);
  }
  onMenuItemClicked(menuItem: MenuItem) {
    if (this.state.currentLabel !== menuItem.label) {
      this.props.onMenuItemClick(menuItem);
      this.setState({ currentLabel: menuItem.label });
    }
  }
  componentWillReceiveProps(newProps: Props) {
    if (newProps.reset)
      this.setState({ currentLabel: this.props.defaultLabel || 'Select an item' });
  }
  onOpen() {
    if (this.props.onOpen)
      this.props.onOpen;
    this.setState({ expanded: true });
  }
  onClose() {
    // Wait for the clicked item to fire before collapse or else it won't fire
    setTimeout(() => this.setState({ expanded: false }), 100);
  }
}