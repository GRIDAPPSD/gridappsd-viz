import * as React from 'react';
import { findDOMNode, createPortal } from 'react-dom'

import { MenuItem } from './MenuItem';
import { PopUp } from '../pop-up/PopUp';

import './DropdownMenu.scss';

interface Props {
  menuItems: MenuItem[];
  onChange: (menuItem: MenuItem, selections?: MenuItem[]) => void;
  defaultSelectedIndex?: number;
  defaultLabel?: string;
  multiple?: boolean;
}

interface State {
  currentLabel: string;
  opened: boolean;
  selection: MenuItem[];
  defaultLabel: string;
  left: number;
  top: number;
}

export class DropdownMenu extends React.Component<Props, State> {
  private _menuListContainer = document.createElement('div');

  constructor(props: Props) {
    super(props);
    this.state = {
      currentLabel: props.defaultLabel || 'Select an item',
      opened: false,
      selection: [],
      defaultLabel: props.defaultLabel || 'Select an item',
      left: 0,
      top: 0
    };
    this.onOpen = this.onOpen.bind(this);
    this._onClose = this._onClose.bind(this);
    this.removePortal = this.removePortal.bind(this);
    this._menuListContainer.className = 'app-dropdown-menu-item-list-container';
    this._menuListContainer.onclick = this._onClose;
  }

  private _onClose() {
    // Wait for the clicked item to fire before collapse or else it won't fire
    setTimeout(() => {
      if (this.props.multiple) {
        this.setState(prevState => ({
          currentLabel: prevState.selection.length === 0 ? prevState.defaultLabel : prevState.selection.map(item => item.label).join(', '),
        }));
        this.props.onChange(null, this.state.selection);
      }
      this.setState({ opened: false });
    }, 100);
  }

  onChange(menuItem: MenuItem) {
    if (this.props.multiple) {
      this.setState(prevState => {
        if (prevState.selection.includes(menuItem))
          return { selection: prevState.selection.filter(e => e !== menuItem) };
        return { selection: [...prevState.selection, menuItem] };
      })
    }
    else if (this.state.currentLabel !== menuItem.label) {
      this.props.onChange(menuItem);
      this.setState({
        currentLabel: menuItem.label,
        opened: false,
        selection: [menuItem]
      });
    }
    else
      this.setState({ opened: false });
  }

  componentWillUnmount() {
    this.removePortal();
    this._menuListContainer.onclick = null;
  }

  removePortal() {
    if (!this.state.opened && document.body.contains(this._menuListContainer))
      document.body.removeChild(this._menuListContainer);
  }

  render() {
    return (
      <div className='app-dropdown-menu'>
        <button
          type='button'
          className='app-dropdown-menu-toggler'
          title={this.state.currentLabel}
          onClick={this.onOpen}>
          <span className='text'>{this.state.currentLabel}</span>
          <i className='app-icon' />
        </button>
        {
          createPortal(
            <PopUp in={this.state.opened} afterClosed={this.removePortal}>
              <ul
                className='app-dropdown-menu-item-list'
                style={{ left: this.state.left + 'px', top: this.state.top + 'px' }}>
                {
                  this.props.menuItems.map((menuItem, i) =>
                    <li
                      key={i}
                      className={'app-dropdown-menu-item' + (this.state.selection.includes(menuItem) ? ' selected' : '')}
                      onClick={() => this.onChange(menuItem)}>
                      <span className='text'>{menuItem.label}</span>
                    </li>
                  )
                }
              </ul>
            </PopUp>,
            this._menuListContainer
          )
        }
      </div>
    );
  }

  onOpen() {
    document.body.appendChild(this._menuListContainer);
    setTimeout(() => {
      const rect = (findDOMNode(this) as HTMLDivElement).getBoundingClientRect();
      this.setState({ opened: true, left: rect.left, top: rect.top });
    }, 0);
  }

  componentDidMount() {
    if (this.props.menuItems.length !== 0 && !this.props.multiple) {
      if (this.props.defaultSelectedIndex < 0 || this.props.defaultSelectedIndex >= this.props.menuItems.length)
        throw new Error('Default item index must be between 0 and ' + (this.props.menuItems.length - 1));
      if (this.props.defaultSelectedIndex !== undefined)
        this.onChange(this.props.menuItems[this.props.defaultSelectedIndex]);
      else if (this.props.menuItems.length === 1)
        this.onChange(this.props.menuItems[0]);
    }
  }

}
