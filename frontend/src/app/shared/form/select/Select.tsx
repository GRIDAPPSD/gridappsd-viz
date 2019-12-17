import * as React from 'react';

import { Option } from './Option';
import { PopUp } from '@shared/pop-up';
import { FormControl } from '../form-control/FormControl';
import { OptionList } from './OptionList';
import { OptionListFilter } from './OptionListFilter';
import { SelectedOptionList } from './SelectedOptionList';
import { ValidationErrorMessages } from '../validation';
import { BasicButton } from '@shared/buttons';
import { Paginator } from '@shared/paginator';
import { fuzzySearch } from '@shared/misc';
import { SelectionOptionBuilder } from './SelectionOptionBuilder';

import './Select.light.scss';
import './Select.dark.scss';

interface Props<T, E extends boolean = false> {
  label: string;
  selectionOptionBuilder: SelectionOptionBuilder<T>;
  onChange: E extends true ? (selections: T[]) => void : (selection: T) => void;
  multiple?: E;
  defaultLabel?: string;
  optional?: boolean;
  disabled?: boolean;
  onClear?: () => void;
  selectedOptionFinder?: (value: T, index: number) => boolean;
}

interface State<T> {
  currentLabel: string;
  opened: boolean;
  selectedOptions: Option<T>[];
  defaultLabel: string;
  left: number;
  top: number;
  allOptions: Option<T>[];
  currentPage: Option<T>[];
  filteredOptions: Option<T>[];
  nothingSelectedMessage: string[];
}

export class Select<T, E extends boolean = false> extends React.Component<Props<T, E>, State<T>> {

  optionListOpener: HTMLButtonElement;

  private _firstPage: Option<T>[] = [];
  private _defaultSelectedOptions: Option<T>[] = [];

  constructor(props: Props<T, E>) {
    super(props);
    this.state = {
      currentLabel: props.defaultLabel || props.multiple ? 'Select one or more' : 'Select an option',
      opened: false,
      selectedOptions: [],
      defaultLabel: props.defaultLabel || props.multiple ? 'Select one or more' : 'Select an option',
      left: 0,
      top: 0,
      currentPage: [],
      allOptions: props.selectionOptionBuilder.getOptions(),
      filteredOptions: props.selectionOptionBuilder.getOptions(),
      nothingSelectedMessage: []
    };

    this.closeOptionList = this.closeOptionList.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.filterOptionList = this.filterOptionList.bind(this);
    this.deselectOption = this.deselectOption.bind(this);
    this.onPageChanged = this.onPageChanged.bind(this);
    this.closeAndNotifySelectionChange = this.closeAndNotifySelectionChange.bind(this);
  }

  closeOptionList() {
    this.setState({
      opened: false
    });
  }

  private _produceCurrentLabelForMultiSelect() {
    return this.state.selectedOptions.map(option => option.label).join(', ') || this.state.defaultLabel;
  }

  onChange(clickedOption: Option<T>) {
    if (this.props.multiple) {
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
      this._toggleAllSelectedOptionsTo(false);
      this.setState({
        currentLabel: clickedOption.label,
        opened: false,
        selectedOptions: [clickedOption]
      });
      clickedOption.isSelected = true;
      (this.props.onChange as (selection: T) => void)(clickedOption.value);
    }
    else {
      this.closeOptionList();
    }
    this._clearSelectionRequiredMessage();
  }

  private _clearSelectionRequiredMessage() {
    this.setState({
      nothingSelectedMessage: []
    });
  }

  private _toggleAllSelectedOptionsTo(isSelected: boolean) {
    for (const selectedOption of this.state.selectedOptions)
      selectedOption.isSelected = isSelected;
  }

  componentDidMount() {
    this._selectDefaultSelectedOptions();
  }

  private _selectDefaultSelectedOptions() {
    if (this.props.selectionOptionBuilder.numberOfOptions() !== 0 && this.props.selectedOptionFinder) {
      if (this.props.multiple) {
        this._defaultSelectedOptions = this.state.allOptions.filter((option, i) => this.props.selectedOptionFinder(option.value, i));
        if (this._defaultSelectedOptions.length > 0) {
          this.setState({
            currentLabel: this._defaultSelectedOptions.map(option => option.label).join(', '),
            selectedOptions: this._defaultSelectedOptions
          }, () => this._toggleAllSelectedOptionsTo(true));
          (this.props.onChange as (selections: T[]) => void)(this._defaultSelectedOptions.map(option => option.value));
        }
      } else {
        const foundOption = this.state.allOptions.find((option, i) => this.props.selectedOptionFinder(option.value, i));
        if (foundOption) {
          this._defaultSelectedOptions = [foundOption];
          this.setState({
            currentLabel: foundOption.label,
            selectedOptions: this._defaultSelectedOptions
          }, () => this._toggleAllSelectedOptionsTo(true));
          (this.props.onChange as (selection: T) => void)(foundOption.value);
        }
      }
    }
  }

  componentWillUnmount() {
    this._toggleAllSelectedOptionsTo(false);
  }

  componentDidUpdate(prevProps: Props<T, E>) {
    if (this.props.selectionOptionBuilder !== prevProps.selectionOptionBuilder) {
      this._firstPage = [];
      this._defaultSelectedOptions = [];
      this.reset();
      this._clearSelectionRequiredMessage();
    }
  }

  reset() {
    this._toggleAllSelectedOptionsTo(false);
    this.setState({
      selectedOptions: this._defaultSelectedOptions,
      currentLabel: this.state.defaultLabel,
      allOptions: this.props.selectionOptionBuilder.getOptions(),
      filteredOptions: this.props.selectionOptionBuilder.getOptions(),
      currentPage: this._firstPage
    }, () => {
      this._toggleAllSelectedOptionsTo(true);
      this._selectDefaultSelectedOptions();
    });
  }

  render() {
    return (
      <FormControl
        className='select'
        label={this.props.label}
        disabled={this.props.selectionOptionBuilder.numberOfOptions() === 0 || this.props.disabled}
        isInvalid={this.state.nothingSelectedMessage.length !== 0}>
        <button
          ref={ref => this.optionListOpener = ref}
          type='button'
          className={`select__option-list__opener${this.state.opened ? ' opened' : ''}`}
          title={this.state.currentLabel}
          onClick={this.onOpen}>
          <span className='text'>{this.state.currentLabel}</span>
          <i className='material-icons'>keyboard_arrow_down</i>
        </button>
        <ValidationErrorMessages messages={this.state.nothingSelectedMessage} />
        <PopUp
          top={this.state.top}
          left={this.state.left}
          in={this.state.opened}
          onBackdropClicked={this.closeOptionList}
          onAfterClosed={this.closeOptionList}>
          <div className='select__option-list-wrapper'>
            <OptionListFilter
              shouldReset={this.state.opened}
              onChange={this.filterOptionList} />
            <SelectedOptionList
              options={this.state.selectedOptions}
              onDeselectOption={this.deselectOption} />
            <OptionList
              options={this.state.currentPage}
              onSelectOption={this.onChange} />
            <Paginator
              items={this.state.filteredOptions}
              onPageChanged={this.onPageChanged} />
            {
              this.props.multiple
              &&
              <footer className='select__button-group'>
                <BasicButton
                  type='negative'
                  label='Close'
                  onClick={this.closeOptionList} />
                <BasicButton
                  type='positive'
                  label='Add'
                  disabled={this.state.selectedOptions.length === 0}
                  onClick={this.closeAndNotifySelectionChange} />
              </footer>
            }
          </div>
        </PopUp>
      </FormControl>
    );
  }

  onOpen() {
    const rect = this.optionListOpener.getBoundingClientRect();
    this.setState({
      opened: true,
      left: rect.left,
      top: rect.top
    });
  }

  filterOptionList(newFilterValue: string, oldFilterValue: string) {
    if (newFilterValue === '')
      this.setState({
        currentPage: this._firstPage,
        filteredOptions: this.state.allOptions
      });
    else
      this.setState(state => {
        const matchFinder = fuzzySearch(newFilterValue);
        // If the user keeps typing
        // then it's more performant to use the filtered list to narrow down the result
        // otherwise, if the user is deleting, then use the props option list
        if (newFilterValue.length > oldFilterValue.length)
          return {
            filteredOptions: state.filteredOptions.filter(option => matchFinder(option.label))
          };
        return {
          filteredOptions: state.allOptions.filter(option => matchFinder(option.label))
        };
      });
  }

  deselectOption(option: Option<T>) {
    const selectedOptions = this.state.selectedOptions.filter(e => e !== option);
    if (selectedOptions.length === 0) {
      this.props.onClear?.();
      if (!this.props.optional) {
        this._showSelectionRequiredMessage();
      }
    }
    this.setState({
      selectedOptions,
      currentLabel: !this.props.multiple ? this.state.defaultLabel : this._produceCurrentLabelForMultiSelect()
    });
    option.isSelected = false;
  }

  private _showSelectionRequiredMessage() {
    this.setState({
      nothingSelectedMessage: this.props.multiple ? ['Please select one or more options'] : ['Please select one option']
    });
  }

  onPageChanged(newPage: Option<T>[]) {
    if (this._firstPage.length === 0)
      this._firstPage = newPage;
    this.setState({
      currentPage: newPage
    });
  }

  closeAndNotifySelectionChange() {
    this.setState({
      currentLabel: this.state.selectedOptions.length === 0
        ? this.state.defaultLabel
        : this._produceCurrentLabelForMultiSelect(),
      opened: false
    });
    (this.props.onChange as (selections: T[]) => void)(this.state.selectedOptions.map(option => option.value));
  }

}
