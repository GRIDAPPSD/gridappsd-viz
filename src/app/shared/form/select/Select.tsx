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

import './Select.light.scss';
import './Select.dark.scss';

interface Props<T, E extends boolean> {
  multiple: E;
  label: string;
  options: Option<T>[];
  onChange: E extends true ? (selections: Option<T>[], label: string) => void : (selection: Option<T>, label: string) => void;
  defaultLabel?: string;
  optional?: boolean;
  disabled?: boolean;
  onClear?: (formControlLabel: string) => void;
  isOptionSelected?: (option: Option<T>, index: number) => boolean;
}

interface State<T> {
  currentLabel: string;
  opened: boolean;
  selectedOptions: Option<T>[];
  defaultLabel: string;
  left: number;
  top: number;
  currentPage: Option<T>[];
  filteredOptions: Option<T>[];
  nothingSelectedMessage: string[];
}

export class Select<T, E extends boolean> extends React.Component<Props<T, E>, State<T>> {

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
      filteredOptions: props.options,
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
      this._toggleAllSelectedOptions(false);
      this.setState({
        currentLabel: clickedOption.label,
        opened: false,
        selectedOptions: [clickedOption]
      });
      clickedOption.isSelected = true;
      (this.props.onChange as ((selection: Option<T>, label: string) => void))(clickedOption, this.props.label);
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

  private _toggleAllSelectedOptions(isSelected: boolean) {
    for (const selectedOption of this.state.selectedOptions)
      selectedOption.isSelected = isSelected;
  }

  componentDidMount() {
    this._selectDefaultSelectedOptions();
  }

  private _selectDefaultSelectedOptions() {
    if (this.props.options.length !== 0 && this.props.isOptionSelected) {
      this._defaultSelectedOptions = this.props.options.filter((option, i) => this.props.isOptionSelected(option, i));
      if (this._defaultSelectedOptions.length > 0) {
        this.setState({
          currentLabel: this._defaultSelectedOptions.map(option => option.label).join(', '),
          selectedOptions: this._defaultSelectedOptions
        }, () => this._toggleAllSelectedOptions(true));
        if (this.props.multiple)
          (this.props.onChange as ((selections: Option<T>[], label: string) => void))(this._defaultSelectedOptions, this.props.label);
        else
          (this.props.onChange as ((selection: Option<T>, label: string) => void))(this._defaultSelectedOptions[0], this.props.label);
      }
    }
  }

  componentWillUnmount() {
    this._toggleAllSelectedOptions(false);
  }

  componentDidUpdate(prevProps: Props<T, E>, _: State<T>) {
    if (this.props.options !== prevProps.options) {
      this._firstPage = [];
      this._defaultSelectedOptions = [];
      this.reset();
      this._selectDefaultSelectedOptions();
      this._clearSelectionRequiredMessage();
    }
  }

  reset() {
    this._toggleAllSelectedOptions(false);
    this.setState({
      selectedOptions: this._defaultSelectedOptions,
      currentLabel: this.state.defaultLabel,
      filteredOptions: this.props.options,
      currentPage: this._firstPage
    }, () => this._toggleAllSelectedOptions(true));
  }

  render() {
    return (
      <FormControl
        className='select'
        label={this.props.label}
        disabled={this.props.options.length === 0 || this.props.disabled}
        isInvalid={this.state.nothingSelectedMessage.length !== 0}>
        <button
          ref={ref => this.optionListOpener = ref}
          type='button'
          className='select__option-list__opener'
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
        filteredOptions: this.props.options
      });
    else
      this.setState((state, props) => {
        const specialTokens = ['(', ')', '[', ']', '{', '}', '?', '\\', '/', '*', '+', '-', '.', '^', '$'];
        // Input sanitization
        const tokens = newFilterValue.split('')
          .map(token => specialTokens.includes(token) ? `\\${token}` : token);
        const pattern = new RegExp(tokens.join('[\\s\\S]*'), 'ig');
        // If the user keeps typing
        // then it's more performant to use the filtered list to narrow down the result
        // otherwise, if the user is deleting, then use the props option list
        if (newFilterValue.length > oldFilterValue.length)
          return {
            filteredOptions: state.filteredOptions.filter(option => pattern.test(option.label))
          };
        return {
          filteredOptions: props.options.filter(option => pattern.test(option.label))
        };
      });
  }

  deselectOption(option: Option<T>) {
    this.setState(state => {
      const selectedOptions = state.selectedOptions.filter(e => e !== option);
      if (selectedOptions.length === 0) {
        if (this.props.onClear)
          this.props.onClear(this.props.label);
        if (!this.props.optional) {
          this._showSelectionRequiredMessage();
        }
      }
      return {
        selectedOptions,
        currentLabel: !this.props.multiple ? this.state.defaultLabel : this._produceCurrentLabelForMultiSelect()
      };
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
    (this.props.onChange as ((selections: Option<T>[], label: string) => void))(this.state.selectedOptions, this.props.label);
  }

}
