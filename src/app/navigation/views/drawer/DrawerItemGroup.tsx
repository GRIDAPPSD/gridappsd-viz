import * as React from 'react';

import './DrawerItemGroup.scss';
import { PopUp } from '../../../shared/views/pop-up/PopUp';

interface Props {
  header: string;
  className?: string;
}

interface State {
  isExpanded: boolean;
}

export class DrawerItemGroup extends React.Component<Props, State> {

  constructor(props: any) {
    super(props);
    this.state = {
      isExpanded: true
    }
    this._collapse = this._collapse.bind(this);
    this._toogle = this._toogle.bind(this);
  }
  render() {
    return (
      <li className={'drawer-item drawer-item-group' + (this.state.isExpanded ? ' expanded' : ' collapsed') + (this.props.className ? ' ' + this.props.className : '')}>
        <button
          className='trigger'
          type='button'
          tabIndex={0}
          onClick={this._toogle}
          onBlur={this._collapse}>
          <span>{this.props.header}</span>
          <i className={'app-icon angle'} />
        </button>
        <PopUp in={this.state.isExpanded}>
          <div
            className='nested-drawer-items'>
            <div className='nested-drawer-items__arrow' />
            <ul
              className='nested-drawer-items__list'
              onClick={this._collapse}>
              {this.props.children}
            </ul>
          </div>
        </PopUp>
      </li>
    );
  }

  componentDidMount() {
    this.setState({ isExpanded: false });
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