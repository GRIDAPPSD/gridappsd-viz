import { Component } from 'react';

import { IconButton } from '@client:common/buttons';

import { PageChangeEvent } from './PageChangeEvent';

import './Paginator.light.scss';
import './Paginator.dark.scss';

interface Props<T> {
  items: Array<T>;
  onPageChange: (event: PageChangeEvent<T>) => void;
  pageSize?: number;
}

interface State {
  currentPageNumber: number;
  currentPageNumberDisplay: string;
}

export class Paginator<T> extends Component<Props<T>, State> {

  totalPages = 0;

  constructor(props: Props<T>) {
    super(props);
    this.state = {
      currentPageNumber: 0,
      currentPageNumberDisplay: '1'
    };
    this.totalPages = Math.ceil(props.items.length / this.props.pageSize);

    this.navigateToNextPage = this.navigateToNextPage.bind(this);
    this.updateCurrentPageNumber = this.updateCurrentPageNumber.bind(this);
    this.navigateToPreviousPage = this.navigateToPreviousPage.bind(this);
  }

  componentDidMount() {
    this._goToPage(0);
  }

  componentDidUpdate(prevProps: Props<T>) {
    if (this.props.items !== prevProps.items) {
      this.totalPages = Math.ceil(this.props.items.length / this.props.pageSize);
      this._goToPage(this.state.currentPageNumber < this.totalPages ? this.state.currentPageNumber : 0);
    }
  }

  render() {
    if (this.props.items.length > this.props.pageSize) {
      this.totalPages = Math.ceil(this.props.items.length / this.props.pageSize);

      return (
        <div className='paginator'>
          <IconButton
            disabled={this.state.currentPageNumber === 0}
            icon='navigate_before'
            style='accent'
            onClick={this.navigateToPreviousPage} />
          <div className='paginator__page-indicator'>
            <input
              type='text'
              className='paginator__page-indicator__current-page-input'
              value={this.state.currentPageNumberDisplay}
              onChange={this.updateCurrentPageNumber} />
            &nbsp;
            /
            &nbsp;
            {this.totalPages}
          </div>
          <IconButton
            disabled={this.state.currentPageNumber === this.totalPages - 1}
            icon='navigate_next'
            style='accent'
            onClick={this.navigateToNextPage} />
        </div>
      );
    }
    return null;
  }

  navigateToPreviousPage() {
    this._goToPage(this.state.currentPageNumber - 1);
  }

  private _goToPage(pageNumber: number) {
    const startSlice = pageNumber * this.props.pageSize;
    this.props.onPageChange(
      new PageChangeEvent(
        this.props.items.slice(startSlice, startSlice + this.props.pageSize),
        startSlice,
        this.props.pageSize
      )
    );
    this.setState({
      currentPageNumber: pageNumber,
      currentPageNumberDisplay: String(pageNumber + 1)
    });
  }

  updateCurrentPageNumber(event: React.ChangeEvent<HTMLInputElement>) {
    const enteredPageNumber = event.target.value;
    const newPageNumber = +enteredPageNumber - 1;
    if (newPageNumber >= 0 && newPageNumber < this.totalPages) {
      this.setState({
        currentPageNumber: newPageNumber
      });
      this._goToPage(newPageNumber);
    } else if (enteredPageNumber === '') {
      this.setState({
        currentPageNumberDisplay: ''
      });
    }
  }

  navigateToNextPage() {
    this._goToPage(this.state.currentPageNumber + 1);
  }

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Paginator as any).defaultProps = {
  pageSize: 50
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as Props<any>;
