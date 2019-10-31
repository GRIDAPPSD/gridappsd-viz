import * as React from 'react';

import { IconButton } from '@shared/buttons';

import './Paginator.light.scss';
import './Paginator.dark.scss';

interface Props<T> {
  items: T[];
  onPageChanged: (page: T[]) => void;
  pageSize?: number;
}

interface State {
  currentPageNumber: number;
  totalPages: number;
}

export class Paginator<T> extends React.Component<Props<T>, State> {

  constructor(props: Props<T>) {
    super(props);
    this.state = {
      currentPageNumber: 0,
      totalPages: Math.ceil(props.items.length / this.props.pageSize)
    };

    this.navigateToNextPage = this.navigateToNextPage.bind(this);
    this.navigateToPreviousPage = this.navigateToPreviousPage.bind(this);
  }

  componentDidMount() {
    this.props.onPageChanged(this.props.items.slice(0, this.props.pageSize));
  }

  componentDidUpdate(prevProps: Props<T>) {
    if (this.props.items !== prevProps.items) {
      this._reset();
      this.props.onPageChanged(this.props.items.slice(0, this.props.pageSize));
    }
  }

  private _reset() {
    this.setState({
      currentPageNumber: 0,
      totalPages: Math.ceil(this.props.items.length / this.props.pageSize)
    });
  }

  render() {
    if (this.props.items.length > this.props.pageSize)
      return (
        <section className='paginator'>
          <IconButton
            disabled={this.state.currentPageNumber === 0}
            icon='navigate_before'
            style='accent'
            onClick={this.navigateToPreviousPage} />
          <div className='paginator__page-indicator'>
            {`${this.state.currentPageNumber + 1} / ${this.state.totalPages}`}
          </div>
          <IconButton
            disabled={this.state.currentPageNumber === this.state.totalPages - 1}
            icon='navigate_next'
            style='accent'
            onClick={this.navigateToNextPage} />
        </section>
      );
    return null;
  }


  navigateToPreviousPage() {
    this.setState(state => {
      const startSlice = (state.currentPageNumber - 1) * this.props.pageSize;
      this.props.onPageChanged(this.props.items.slice(startSlice, startSlice + this.props.pageSize));
      return {
        currentPageNumber: state.currentPageNumber - 1
      };
    });
  }

  navigateToNextPage() {
    this.setState(state => {
      const startSlice = (state.currentPageNumber + 1) * this.props.pageSize;
      this.props.onPageChanged(this.props.items.slice(startSlice, startSlice + this.props.pageSize));
      return {
        currentPageNumber: state.currentPageNumber + 1,
      };
    });
  }

}

(Paginator as any).defaultProps = {
  pageSize: 50
} as Props<any>;
