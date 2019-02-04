import * as React from 'react';

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
}

export class DropdownMenu extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      currentLabel: props.defaultLabel || 'Select an item',
      opened: false,
      selection: [],
      defaultLabel: props.defaultLabel || 'Select an item'
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
                  className={'app-dropdown-menu-item' + (this.state.selection.includes(menuItem) ? ' selected' : '')}
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
    if (this.props.menuItems.length !== 0 && !this.props.multiple) {
      if (this.props.defaultSelectedIndex < 0 || this.props.defaultSelectedIndex >= this.props.menuItems.length)
        throw new Error('Default item index must be between 0 and ' + (this.props.menuItems.length - 1));
      if (this.props.defaultSelectedIndex !== undefined)
        this._onChange(this.props.menuItems[this.props.defaultSelectedIndex]);
    }
  }

  private _onOpen() {
    this.setState({ opened: true });
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

  private _onChange(menuItem: MenuItem) {
    if (this.props.multiple) {
      this.setState(prevState => {
        if (prevState.selection.includes(menuItem))
          return {
            selection: prevState.selection.filter(e => e !== menuItem)
          };
        return {
          selection: [...prevState.selection, menuItem]
        };
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
}