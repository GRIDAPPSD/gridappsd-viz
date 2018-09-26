import * as React from 'react';

import { MenuItem } from './MenuItem';
import { PopUp } from '../pop-up/PopUp';

import './DropdownMenu.scss';

interface Props {
  menuItems: MenuItem[];
  onChange: (menuItem: MenuItem) => void;
  onOpen?: () => void;
  defaultSelectedIndex?: number;
  defaultLabel?: string;
  reset?: boolean;
}

interface State {
  currentLabel: string;
  opened: boolean;
}

export class DropdownMenu extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      currentLabel: this.props.defaultLabel || 'Select an item',
      opened: false
    };
    this._onOpen = this._onOpen.bind(this);
    this._onClose = this._onClose.bind(this);
  }
  render() {
    return (
      <div className='app-dropdown-menu'>
        <div
          style={{ display: this.state.opened ? 'block' : 'none' }}
          className='app-dropdown-menu__click-capture'
          onClick={this._onClose} />
        <button
          type='button'
          className='app-dropdown-menu-toggler'
          title={this.state.currentLabel}
          onClick={this._onOpen}>
          <span className='text'>{this.state.currentLabel}</span>
          <i className='app-icon'></i>
        </button>

        <PopUp in={this.state.opened}>
          <ul className='app-dropdown-menu-item-list'>
            {
              this.props.menuItems.map((menuItem, i) =>
                <li
                  key={i}
                  className={'app-dropdown-menu-item' + (this.state.currentLabel === menuItem.label ? ' selected' : '')}
                  onClick={() => this._onChange(menuItem)}>
                  <span className="text">{menuItem.label}</span>
                </li>
              )
            }
          </ul>
        </PopUp>
      </div>
    );
  }

  componentDidMount() {
    if (this.props.defaultSelectedIndex < 0 || this.props.defaultSelectedIndex >= this.props.menuItems.length)
      throw new Error('Default item index must be between 0 and ' + (this.props.menuItems.length - 1));
    if (this.props.defaultSelectedIndex !== undefined)
      this._onChange(this.props.menuItems[this.props.defaultSelectedIndex]);
  }

  componentWillReceiveProps(newProps: Props) {
    if (newProps.reset)
      this.setState({ currentLabel: this.props.defaultLabel || 'Select an item' });
  }
  private _onOpen() {
    if (this.props.onOpen)
      this.props.onOpen();
    this.setState({ opened: true });
  }

  private _onClose() {
    // Wait for the clicked item to fire before collapse or else it won't fire
    setTimeout(() => this.setState({ opened: false }), 100);
  }

  private _onChange(menuItem: MenuItem) {
    if (this.state.currentLabel !== menuItem.label) {
      this.props.onChange(menuItem);
      this.setState({
        currentLabel: menuItem.label,
        opened: false
      });
    }
    else
      this.setState({ opened: false });
  }
}