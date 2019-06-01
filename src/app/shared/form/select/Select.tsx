import * as React from 'react';
import { findDOMNode, createPortal } from 'react-dom'

import { Option } from './Option';
import { PopUp } from '@shared/pop-up';
import { FormControl } from '../form-control/FormControl';

import './Select.scss';

interface Props<T> {
  label: string;
  options: Option<T>[];
  onChange: (selections: Option<T>[]) => void;
  selectedOptions?: (option: Option<T>, index: number) => boolean;
  defaultLabel?: string;
  multiple?: boolean;
}

interface State<T> {
  currentLabel: string;
  opened: boolean;
  selectedIndices: number[];
  defaultLabel: string;
  left: number;
  top: number;
}

export class Select<T> extends React.Component<Props<T>, State<T>> {

  optionListOpener: HTMLButtonElement;

  private readonly _optionListContainer = document.createElement('div');

  constructor(props: Props<T>) {
    super(props);
    this.state = {
      currentLabel: props.defaultLabel || props.multiple ? 'Select one or more' : 'Select one option',
      opened: false,
      selectedIndices: [],
      defaultLabel: props.defaultLabel || props.multiple ? 'Select one or more' : 'Select an option',
      left: 0,
      top: 0
    };
    this.onOpen = this.onOpen.bind(this);
    this._onClose = this._onClose.bind(this);
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
        const selectedOptions = this.state.selectedIndices.map(i => this.props.options[i]);
        this.setState({
          currentLabel: selectedOptions.length === 0
            ? this.state.defaultLabel
            : selectedOptions.map(option => option.label).join(', '),
        });
        this.props.onChange(selectedOptions);
      }
    }
  }

  onChange(index: number) {
    if (this.props.multiple && this.props.options.length !== 1) {
      this.setState(prevState => {
        if (prevState.selectedIndices.includes(index))
          return {
            selectedIndices: prevState.selectedIndices.filter(e => e !== index)
          };
        return {
          selectedIndices: [...prevState.selectedIndices, index]
        };
      })
    }
    else if (this.state.selectedIndices[0] !== index) {
      this.setState({
        currentLabel: this.props.options[index].label,
        opened: false,
        selectedIndices: [index]
      });
      this.props.onChange([this.props.options[index]]);
    }
    else {
      this.setState({
        opened: false
      });
      this.props.onChange([this.props.options[index]]);
    }
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
      if (this.props.options.length !== prevProps.options.length || this.props.options.length === 0)
        this.setState({
          selectedIndices: [],
          currentLabel: this.state.defaultLabel
        });
    }
  }

  reset() {
    this.setState({
      selectedIndices: [],
      currentLabel: this.state.defaultLabel
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
                <ul className='select__option-list'>
                  {
                    this.props.options.map((option, index) =>
                      <li
                        key={index}
                        className={`select__option-list__option${this.state.selectedIndices.includes(index) ? ' selected' : ''}`}
                        onClick={() => this.onChange(index)}>
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
      top: rect.top
    });
  }

  componentDidMount() {
    if (this.props.options.length !== 0 && this.props.selectedOptions) {
      const selectedIndices = this.props.options.map((option, i) => this.props.selectedOptions(option, i) ? i : -1)
        .filter(i => i !== -1);
      if (selectedIndices.length > 0) {
        const selectedOptions = selectedIndices.map(i => this.props.options[i]);
        this.setState({
          currentLabel: selectedOptions.map(option => option.label).join(', '),
          selectedIndices
        });
        this.props.onChange(selectedOptions);
      }
    }
  }

}
