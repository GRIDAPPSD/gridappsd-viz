import * as React from 'react';
import { Subject, Observable } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';

import { IconButton } from '@shared/buttons';


import './OptionListFilter.scss';

interface Props {
  onChange: (newValue: string, oldValue: string) => void;
}
interface State {
  filterValue: string;
}

export class OptionListFilter extends React.Component<Props, State> {

  filterInput: HTMLInputElement;

  private readonly _valueChanger = new Subject<[string, string]>();

  constructor(props: Props) {
    super(props);

    this.state = {
      filterValue: ''
    };

    this.onChange = this.onChange.bind(this);
    this.clearFilter = this.clearFilter.bind(this);
  }

  componentDidMount() {
    this._valueChanger.pipe(distinctUntilChanged(), debounceTime(250))
      .subscribe({
        next: (values: [string, string]) => this.props.onChange(values[0], values[1])
      });
  }
  componentDidUpdate() {
    setTimeout(() => this.filterInput.focus(), 250);
  }

  componentWillUnmount() {
    this._valueChanger.complete();
  }

  render() {
    return (
      <form className='option-list-filter'>
        <input
          ref={ref => this.filterInput = ref}
          type='text'
          className='option-list-filter__input'
          autoFocus={true}
          value={this.state.filterValue}
          onChange={this.onChange} />
        <IconButton
          className='option-list-filter__clear'
          disabled={this.state.filterValue === ''}
          rounded
          icon='close'
          size='small'
          style='accent'
          onClick={this.clearFilter} />
      </form>
    );
  }

  onChange(event: any) {
    const filterValue = event.target.value.toLowerCase();
    this._valueChanger.next([filterValue, this.state.filterValue]);
    this.setState({
      filterValue
    });
  }

  clearFilter() {
    this._valueChanger.next(['', this.state.filterValue]);
    this.setState({
      filterValue: ''
    });
  }

}
