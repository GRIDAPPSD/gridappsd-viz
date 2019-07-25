import * as React from 'react';

import { Option } from './Option';
import { IconButton } from '@shared/buttons';

import './OptionListPaginator.scss';

interface Props<T> {
  options: Option<T>[];
  onPageChanged: (options: Option<T>[]) => void;
}

interface State {
  currentPageNumber: number;
  totalPages: number;
}

const pageSize = 50;

export class OptionListPaginator<T> extends React.Component<Props<T>, State> {
  constructor(props: Props<T>) {
    super(props);
    this.state = {
      currentPageNumber: 0,
      totalPages: Math.ceil(props.options.length / pageSize)
    };

    this.navigateToNextPage = this.navigateToNextPage.bind(this);
    this.navigateToPreviousPage = this.navigateToPreviousPage.bind(this);
  }

  componentDidMount() {
    this.props.onPageChanged(this.props.options.slice(0, pageSize));
  }

  componentDidUpdate(prevProps: Props<T>) {
    if (this.props.options !== prevProps.options) {
      this._reset();
      this.props.onPageChanged(this.props.options.slice(0, pageSize));
    }
  }

  private _reset() {
    this.setState({
      currentPageNumber: 0,
      totalPages: Math.ceil(this.props.options.length / pageSize)
    });
  }

  render() {
    if (this.props.options.length > pageSize)
      return (
        <footer className='option-list-paginator'>
          <IconButton
            disabled={this.state.currentPageNumber === 0}
            icon='navigate_before'
            style='accent'
            onClick={this.navigateToPreviousPage} />
          <div className='option-list-paginator__page-indicator'>
            {`${this.state.currentPageNumber + 1} / ${this.state.totalPages}`}
          </div>
          <IconButton
            disabled={this.state.currentPageNumber === this.state.totalPages - 1}
            icon='navigate_next'
            style='accent'
            onClick={this.navigateToNextPage} />
        </footer>
      );
    return null;
  }


  navigateToPreviousPage() {
    this.setState(state => {
      const startSlice = (state.currentPageNumber - 1) * pageSize;
      this.props.onPageChanged(this.props.options.slice(startSlice, startSlice + pageSize));
      return {
        currentPageNumber: state.currentPageNumber - 1
      };
    });
  }

  navigateToNextPage() {
    this.setState(state => {
      const startSlice = (state.currentPageNumber + 1) * pageSize;
      this.props.onPageChanged(this.props.options.slice(startSlice, startSlice + pageSize));
      return {
        currentPageNumber: state.currentPageNumber + 1,
      };
    });
  }

}
