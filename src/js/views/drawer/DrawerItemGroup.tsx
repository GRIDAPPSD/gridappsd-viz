import * as React from 'react';
import './DrawerItemGroup.styles.scss';

interface Props {
  header: string;
  className?: string;
}
interface State {
  isExpanded: boolean;
}
export class DrawerItemGroup extends React.Component<Props, State> {

  private _nestedDrawerItemList: HTMLElement;
  private _nestedDrawerItemListHeight: number;

  constructor(props: any) {
    super(props);
    this.state = {
      isExpanded: true
    }
    this._collapse = this._collapse.bind(this);
    this._toggleExpand = this._toggleExpand.bind(this);
  }
  render() {
    return (
      <li className={'drawer-item drawer-item-group' + (this.state.isExpanded ? ' expanded' : ' collapsed') + (this.props.className ? ' ' + this.props.className : '')}>
        <header onClick={this._toggleExpand}>
          <span>{this.props.header}</span>
          <i className={'app-icon angle'} />
        </header>
        <ul
          className='nested-drawer-items'
          ref={elem => this._nestedDrawerItemList = elem}
          onClick={this._collapse}>
          {this.props.children}
        </ul>
      </li>
    );
  }

  componentDidMount() {
    this._nestedDrawerItemListHeight = this._nestedDrawerItemList.getBoundingClientRect().height;
    this.setState({ isExpanded: false });
  }

  private _collapse() {
    this._nestedDrawerItemList.style.height = '0';
    this.setState({ isExpanded: false });
  }

  private _toggleExpand(event: any) {
    event.stopPropagation();
    if (this.state.isExpanded) {
      this._nestedDrawerItemList.style.height = '0';
      this.setState({ isExpanded: false });
    }
    else {
      this._nestedDrawerItemList.style.height = this._nestedDrawerItemListHeight + 'px';
      this.setState({ isExpanded: true });
    }
  }
}