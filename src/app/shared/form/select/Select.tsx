import * as React from 'react';
import { findDOMNode, createPortal } from 'react-dom'

import { Option } from './Option';
import { PopUp } from '@shared/pop-up';
import { FormControl } from '../form-control/FormControl';
import { IconButton } from '@shared/buttons';

import './Select.scss';

interface Props<T> {
  label: string;
  options: Option<T>[];
  onChange: (selections: Option<T>[]) => void;
  isOptionSelected?: (option: Option<T>, index: number) => boolean;
  defaultLabel?: string;
  multiple?: boolean;
}

interface State<T> {
  currentLabel: string;
  opened: boolean;
  selectedOptions: Option<T>[];
  defaultLabel: string;
  left: number;
  top: number;
  filter: string;
  filteredOptions: Option<T>[];
}

export class Select<T> extends React.Component<Props<T>, State<T>> {

  optionListOpener: HTMLButtonElement;
  filterInput: HTMLInputElement;

  private readonly _optionListContainer = document.createElement('div');
  private _filterTimeout: any;

  constructor(props: Props<T>) {
    super(props);
    this.state = {
      currentLabel: props.defaultLabel || props.multiple ? 'Select one or more' : 'Select one option',
      opened: false,
      selectedOptions: [],
      defaultLabel: props.defaultLabel || props.multiple ? 'Select one or more' : 'Select an option',
      left: 0,
      top: 0,
      filter: '',
      filteredOptions: props.options
    };
    this.onOpen = this.onOpen.bind(this);
    this._onClose = this._onClose.bind(this);
    this.filterOptionList = this.filterOptionList.bind(this);
    this.clearFilter = this.clearFilter.bind(this);
    this.removePortal = this.removePortal.bind(this);
    this._optionListContainer.className = 'select-option-list-container';
    this._optionListContainer.onclick = this._onClose;
  }

  private _onClose(event: MouseEvent) {
    // this should only be triggered when the user clicks off the option list to close
    if (event.target === this._optionListContainer) {
      // Wait for the clicked option to fire before closing or else it won't fire
      setTimeout(() => this.setState({ opened: false }), 100);
      // if multiple is true, then only fire onChange when the option list is closed
      if (this.props.multiple) {
        this.setState({
          currentLabel: this.state.selectedOptions.length === 0
            ? this.state.defaultLabel
            : this.state.selectedOptions.map(option => option.label).join(', '),
        });
        this.props.onChange(this.state.selectedOptions);
      }
    }
  }

  onChange(clickedOption: Option<T>) {
    if (this.props.multiple && this.props.options.length > 1) {
      if (clickedOption.isSelected)
        this.setState({
          selectedOptions: this.state.selectedOptions.filter(option => option.label !== clickedOption.label)
        });
      else
        this.setState({
          selectedOptions: [...this.state.selectedOptions, clickedOption]
        });
      clickedOption.isSelected = !clickedOption.isSelected;
    }
    else if (!clickedOption.isSelected) {
      this._toggleAllSelectedOptions(false);
      const selectedOptions = [clickedOption];
      this.setState({
        currentLabel: clickedOption.label,
        opened: false,
        selectedOptions
      });
      clickedOption.isSelected = true;
      this.props.onChange(selectedOptions);
    }
    else {
      this.setState({
        opened: false
      });
    }
  }

  private _toggleAllSelectedOptions(isSelected: boolean) {
    for (const selectedOption of this.state.selectedOptions)
      selectedOption.isSelected = isSelected;
  }

  componentWillUnmount() {
    this.removePortal();
    this._optionListContainer.onclick = null;
  }

  removePortal() {
    if (!this.state.opened && document.body.contains(this._optionListContainer))
      document.body.removeChild(this._optionListContainer);
  }

  componentDidUpdate(prevProps: Props<T>) {
    if (this.props.options !== prevProps.options) {
      // if (this.props.options.length !== prevProps.options.length || this.props.options.length === 0)
      this.reset();
    }
  }

  reset() {
    this._toggleAllSelectedOptions(false);
    this.setState({
      selectedOptions: [],
      currentLabel: this.state.defaultLabel,
      filter: ''
    });
  }

  render() {
    return (
      <FormControl
        className={`select${this.props.options.length === 0 ? ' disabled' : ''}`}
        label={this.props.label}>
        <button
          ref={ref => this.optionListOpener = ref}
          type='button'
          className='select__option-list__opener'
          title={this.state.currentLabel}
          onClick={this.onOpen}>
          <span className='text'>{this.state.currentLabel}</span>
          <i className='material-icons'>keyboard_arrow_down</i>
        </button>
        {
          createPortal(
            <PopUp
              in={this.state.opened}
              afterClosed={this.removePortal}>
              <div
                className='select__option-list-wrapper'
                style={{
                  left: this.state.left + 'px',
                  top: this.state.top + 'px'
                }}>
                <form className='select__option-list__filter'>
                  <input
                    ref={ref => this.filterInput = ref}
                    type='text'
                    className='select__option-list__filter__input'
                    autoFocus={true}
                    value={this.state.filter}
                    onChange={this.filterOptionList} />
                  <IconButton
                    className='select__option-list__filter__clear'
                    disabled={this.state.filter === ''}
                    rounded
                    icon='close'
                    size='small'
                    style='accent'
                    onClick={this.clearFilter} />
                </form>
                <ul className='select__option-list'>
                  {
                    this.state.filteredOptions.map((option, index) =>
                      <li
                        key={index}
                        className={`select__option-list__option${option.isSelected ? ' selected' : ''}`}
                        onClick={() => this.onChange(option)}>
                        <span className='text'>{option.label}</span>
                      </li>
                    )
                  }
                </ul>
              </div>
            </PopUp>,
            this._optionListContainer
          )
        }
      </FormControl>
    );
  }

  onOpen() {
    document.body.appendChild(this._optionListContainer);
    const rect = this.optionListOpener.getBoundingClientRect();
    this.setState({
      opened: true,
      left: rect.left,
      top: rect.top,
      filter: '',
      filteredOptions: this.props.options
    });
    // Need to wait a little after component is rendered to focus the filter
    setTimeout(() => {
      this.filterInput.focus();
      if (!this.props.multiple && this.state.selectedOptions.length === 1)
        document.querySelector('.select__option-list__option.selected')
          .scrollIntoView();
    }, 500);
  }

  filterOptionList(event: any) {
    clearTimeout(this._filterTimeout);
    const filterValue = event.target.value.toLowerCase();
    this.setState({
      filter: filterValue,
    });
    this._filterTimeout = setTimeout(() => {
      this.setState((state, props) => {
        // If the user keeps typing
        // then it's more performant to use the filtered list to narrow down the result
        // otherwise, if the user is deleting, then use the props option list
        if (filterValue.length > state.filter && state.filteredOptions.length > 0)
          return {
            filteredOptions: state.filteredOptions.filter(option => option.label.toLowerCase().startsWith(filterValue))
          };
        return {
          filteredOptions: props.options.filter(option => option.label.toLowerCase().startsWith(filterValue))
        };
      });
    }, 250);
  }

  clearFilter() {
    this.setState({
      filter: '',
      filteredOptions: this.props.options
    });
  }

  componentDidMount() {
    if (this.props.options.length !== 0 && this.props.isOptionSelected) {
      const selectedOptions = this.props.options.filter((option, i) => this.props.isOptionSelected(option, i));
      if (selectedOptions.length > 0) {
        this.setState({
          currentLabel: selectedOptions.map(option => option.label).join(', '),
          selectedOptions
        }, () => this._toggleAllSelectedOptions(true));
        this.props.onChange(selectedOptions);

      }
    }
  }

}
