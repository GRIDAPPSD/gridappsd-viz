import * as React from 'react';
import { Subject } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';

import { IconButton } from '@shared/buttons';

import './OptionListFilter.light.scss';
import './OptionListFilter.dark.scss';

interface Props {
  onChange: (newValue: string, oldValue: string) => void;
  shouldReset: boolean;
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

  componentDidUpdate(prevProps: Props) {
    if (this.filterInput && this.state.filterValue === '')
      setTimeout(() => this.filterInput?.focus(), 250);
    if (this.props.shouldReset && this.props.shouldReset !== prevProps.shouldReset && this.state.filterValue !== '')
      this.clearFilter();
  }

  componentWillUnmount() {
    this._valueChanger.complete();
  }

  render() {
    return (
      <div className='option-list-filter'>
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
          icon='close'
          size='small'
          style='accent'
          onClick={this.clearFilter} />
      </div>
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
