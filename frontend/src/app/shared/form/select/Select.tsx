import * as React from 'react';
import { Subscription } from 'rxjs';

import { Option } from './Option';
import { FormControl } from '../form-control/FormControl';
import { OptionList } from './OptionList';
import { OptionListFilter } from './OptionListFilter';
import { SelectedOptionList } from './SelectedOptionList';
import { BasicButton } from '@shared/buttons';
import { Paginator, PageChangeEvent } from '@shared/paginator';
import { fuzzySearch } from '@shared/misc';
import { SelectionOptionBuilder } from './SelectionOptionBuilder';
import { FormControlModel } from '../models/FormControlModel';
import { Dialog } from '@shared/overlay/dialog';

import './Select.light.scss';
import './Select.dark.scss';

interface Props<T, E extends boolean = false> {
  label: string;
  selectionOptionBuilder: SelectionOptionBuilder<T>;
  formControlModel: E extends true ? FormControlModel<T[]> : FormControlModel<T>;
  multiple?: E;
  defaultLabel?: string;
  optional?: boolean;
  selectedOptionFinder?: (value: T, index: number) => boolean;
}

interface State<T> {
  currentLabel: string;
  open: boolean;
  selectedOptions: Option<T>[];
  left: number;
  top: number;
  currentPage: Option<T>[];
  filteredOptions: Option<T>[];
}

export class Select<T, E extends boolean> extends React.Component<Props<T, E>, State<T>> {

  readonly optionListOpenerRef = React.createRef<HTMLButtonElement>();

  private readonly _defaultLabel: string;

  private _firstPage: Option<T>[] = [];
  private _defaultSelectedOptions: Option<T>[] = [];
  private _selectedOptionsBeforeOpening: Option<T>[] = [];
  private _subscription: Subscription;

  constructor(props: Props<T, E>) {
    super(props);
    this.state = {
      currentLabel: props.defaultLabel || props.multiple ? 'Select one or more' : 'Select an option',
      open: false,
      selectedOptions: [],
      left: 0,
      top: 0,
      currentPage: [],
      filteredOptions: props.selectionOptionBuilder.getOptions()
    };

    this._defaultLabel = this.state.currentLabel;

    if (props.optional !== true) {
      props.formControlModel.addValidator(control => {
        const value = control.getValue() as T | T[] | string;
        return {
          isValid: !Array.isArray(value) ? value !== null && value !== undefined && value !== '' : value.length > 0,
          errorMessage: 'Please select an option'
        };
      });
    }

    this.closeOptionList = this.closeOptionList.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.filterOptionList = this.filterOptionList.bind(this);
    this.deselectOption = this.deselectOption.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.closeAndNotifySelectionChange = this.closeAndNotifySelectionChange.bind(this);
  }

  componentDidMount() {
    this._subscription = this.props.formControlModel.onReset()
      .subscribe({
        next: () => this._reset()
      });
    this._selectDefaultSelectedOptions();
    if (this.props.selectionOptionBuilder.numberOfOptions() === 0) {
      this.props.formControlModel.disable();
    }
  }

  private _reset() {
    this._toggleAllSelectedOptionsTo(false);
    if (this.props.selectionOptionBuilder.numberOfOptions() === 0) {
      this.props.formControlModel.disable();
    } else {
      this.props.formControlModel.enable();
    }
    this.setState({
      selectedOptions: this._defaultSelectedOptions,
      currentLabel: this._defaultSelectedOptions.length === 0
        ? this._defaultLabel
        : this._defaultSelectedOptions.map(option => option.label).join(', '),
      filteredOptions: this.props.selectionOptionBuilder.getOptions(),
      currentPage: this._firstPage
    }, () => this._toggleAllSelectedOptionsTo(true));
  }

  private _toggleAllSelectedOptionsTo(isSelected: boolean) {
    for (const selectedOption of this.state.selectedOptions) {
      selectedOption.isSelected = isSelected;
    }
  }

  private _selectDefaultSelectedOptions() {
    if (this.props.selectionOptionBuilder.numberOfOptions() > 0) {
      if (this.props.selectedOptionFinder) {
        if (!this.props.multiple) {
          const foundOption = this.props.selectionOptionBuilder.getOptions().find((option, i) => this.props.selectedOptionFinder(option.value, i));
          this._defaultSelectedOptions = foundOption ? [foundOption] : [];
        } else {
          this._defaultSelectedOptions = this.props.selectionOptionBuilder.getOptions().filter((option, i) => this.props.selectedOptionFinder(option.value, i));
        }
      } else if (this.props.optional !== true && this.props.selectionOptionBuilder.numberOfOptions() === 1) {
        this._defaultSelectedOptions = this.props.selectionOptionBuilder.getOptions();
      }
      if (this._defaultSelectedOptions.length > 0) {
        this.setState({
          currentLabel: this._defaultSelectedOptions.map(option => option.label).join(', '),
          selectedOptions: this._defaultSelectedOptions
        }, () => this._toggleAllSelectedOptionsTo(true));
        this._updateFormControlValue(
          !this.props.multiple
            ? this._defaultSelectedOptions[0].value
            : this._defaultSelectedOptions.map(option => option.value)
        );
      }
    } else {
      this._defaultSelectedOptions = [];
    }
  }

  private _updateFormControlValue(value: T | T[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.props.formControlModel.setValue(value as any);
  }

  componentDidUpdate(prevProps: Props<T, E>) {
    if (this.props.selectionOptionBuilder !== prevProps.selectionOptionBuilder) {
      this.props.formControlModel.reset();
      this._firstPage = [];
      this._selectDefaultSelectedOptions();
    }
  }

  componentWillUnmount() {
    this._subscription.unsubscribe();
    this._toggleAllSelectedOptionsTo(false);
  }

  render() {
    return (
      <FormControl
        className='select'
        formControlModel={this.props.formControlModel}
        label={this.props.label}>
        <button
          ref={this.optionListOpenerRef}
          type='button'
          className={`select__option-list__opener${this.state.open ? ' opened' : ''}`}
          title={this.state.currentLabel}
          onClick={this.onOpen}>
          <span className='text'>{this.state.currentLabel}</span>
          <i className='material-icons'>keyboard_arrow_down</i>
        </button>
        <Dialog
          transparentBackdrop
          open={this.state.open}
          top={this.state.top}
          left={this.state.left}
          onBackdropClicked={this.closeOptionList}>
          <div className='select__option-list-wrapper'>
            <OptionListFilter
              shouldReset={this.state.open}
              onChange={this.filterOptionList} />
            <SelectedOptionList
              options={this.state.selectedOptions}
              onDeselectOption={this.deselectOption} />
            <OptionList
              options={this.state.currentPage}
              onSelectOption={this.onChange} />
            <Paginator
              items={this.state.filteredOptions}
              onPageChange={this.onPageChange} />
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
                  label='Confirm'
                  disabled={this.state.selectedOptions.length === 0 && this.props.formControlModel.isPristine()}
                  onClick={this.closeAndNotifySelectionChange} />
              </footer>
            }
          </div>
        </Dialog>
      </FormControl>
    );
  }

  onOpen() {
    const rect = this.optionListOpenerRef.current.getBoundingClientRect();
    this.setState({
      open: true,
      left: rect.left,
      top: rect.top
    });
    if (this.props.multiple) {
      this._selectedOptionsBeforeOpening = this.state.selectedOptions;
    }
  }

  closeOptionList() {
    this.setState({
      open: false
    });
    if (this.state.selectedOptions !== this._selectedOptionsBeforeOpening) {
      this.setState({
        selectedOptions: this._selectedOptionsBeforeOpening
      }, () => this._toggleAllSelectedOptionsTo(true));
    }
  }

  filterOptionList(newFilterValue: string, oldFilterValue: string) {
    if (newFilterValue === '') {
      this.setState({
        currentPage: this._firstPage,
        filteredOptions: this.props.selectionOptionBuilder.getOptions()
      });
    } else {
      this.setState(state => {
        const matchFinder = fuzzySearch(newFilterValue);
        // If the user keeps typing
        // then it's more performant to use the filtered list to narrow down the result
        // otherwise, if the user is deleting, then use the props option list
        if (newFilterValue.length > oldFilterValue.length) {
          return {
            filteredOptions: state.filteredOptions.filter(option => matchFinder(option.label))
          };
        }
        return {
          filteredOptions: this.props.selectionOptionBuilder.getOptions()
            .filter(option => matchFinder(option.label))
        };
      });
    }
  }

  deselectOption(option: Option<T>) {
    if (!this.props.multiple) {
      this.props.formControlModel.reset();
      this.props.formControlModel.markDirty();
      this.setState({
        selectedOptions: [],
        currentLabel: this._defaultLabel
      });
    } else {
      const remainingSelectedOptions = this.state.selectedOptions.filter(e => e !== option);
      this._updateFormControlValue(remainingSelectedOptions.map(e => e.value));
      this.setState({
        selectedOptions: remainingSelectedOptions,
        currentLabel: remainingSelectedOptions.length > 0
          ? remainingSelectedOptions.map(e => e.label).join(', ')
          : this._defaultLabel
      });
    }
    option.isSelected = false;
  }

  onChange(clickedOption: Option<T>) {
    if (this.props.multiple) {
      if (clickedOption.isSelected) {
        this.setState({
          selectedOptions: this.state.selectedOptions.filter(option => option.label !== clickedOption.label)
        });
      } else {
        this.setState({
          selectedOptions: [...this.state.selectedOptions, clickedOption]
        });
      }
      clickedOption.isSelected = !clickedOption.isSelected;
    } else if (!clickedOption.isSelected) {
      this._toggleAllSelectedOptionsTo(false);
      this.setState({
        currentLabel: clickedOption.label,
        open: false,
        selectedOptions: [clickedOption]
      });
      clickedOption.isSelected = true;
      this._updateFormControlValue(clickedOption.value);
    } else {
      this.closeOptionList();
    }
  }

  onPageChange(event: PageChangeEvent<Option<T>>) {
    if (this._firstPage.length === 0) {
      this._firstPage = event.currentPage;
    }
    this.setState({
      currentPage: event.currentPage
    });
  }

  closeAndNotifySelectionChange() {
    this.setState({
      currentLabel: this.state.selectedOptions.length === 0
        ? this._defaultLabel
        : this.state.selectedOptions.map(option => option.label).join(', '),
      open: false
    });
    this._updateFormControlValue(this.state.selectedOptions.map(option => option.value));
  }

}
