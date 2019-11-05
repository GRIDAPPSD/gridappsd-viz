import * as React from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { FormControl } from '../form-control/FormControl';
import { ValidationErrorMessages, Validator, ValidationResult } from '../validation';

import './TextArea.light.scss';
import './TextArea.dark.scss';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  validators?: Validator[];
  disabled?: boolean;
  readonly?: boolean;
  onValidate?: (isValid: boolean, formControlLabel: string) => void;
  hint?: string;
}

interface State {
  validationErrors: ValidationResult[];
}

export class TextArea extends React.Component<Props, State> {

  inputBox: HTMLElement;

  private readonly _valueChanges = new Subject<string>();
  private _isResizing = false;
  // The x coordinate of the mousedown event when the user begins the resize
  private _initialClientX = 0;
  // The y coordinate of the mousedown event when the user begins the resize
  private _initialClientY = 0;
  private _inputBoxBoundingBox: ClientRect;

  constructor(props: Props) {
    super(props);
    this.state = {
      validationErrors: []
    };

    this.resize = this.resize.bind(this);
    this.stopResize = this.stopResize.bind(this);
    this._onInputValueChanged = this._onInputValueChanged.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.beginResize = this.beginResize.bind(this);
  }


  componentDidMount() {
    this._inputBoxBoundingBox = this.inputBox.getBoundingClientRect();
    this._valueChanges.pipe(debounceTime(250))
      .subscribe({
        next: this._onInputValueChanged
      });

    window.addEventListener('mousemove', this.resize, false);
    window.addEventListener('mouseup', this.stopResize, false);
  }

  resize(event: MouseEvent) {
    if (this._isResizing) {
      const styles = [];
      const newWidth = this._inputBoxBoundingBox.width + event.clientX - this._initialClientX;
      if (newWidth > 0 && newWidth + this._inputBoxBoundingBox.left < document.body.clientWidth)
        styles.push(`width:${newWidth}px`);
      const newHeight = this._inputBoxBoundingBox.height + event.clientY - this._initialClientY;
      if (newHeight > 0 && newHeight + this._inputBoxBoundingBox.top < document.body.clientHeight)
        styles.push(`height:${newHeight}px;max-height:${newHeight}px`);
      this.inputBox.setAttribute('style', styles.join(';'));
    }
  }

  stopResize() {
    this._isResizing = false;
    document.body.classList.remove('frozen');
  }

  private _onInputValueChanged(value: string) {
    if (this.props.validators) {
      const validationErrors = this.props.validators.map(validator => validator(value))
        .filter(result => !result.isValid);
      this.setState({
        validationErrors
      });
      const isValid = validationErrors.length === 0;
      if (this.props.onValidate)
        this.props.onValidate(isValid, this.props.label);
      if (isValid)
        this.props.onChange(value);
    }
    else
      this.props.onChange(value);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.disabled !== prevProps.disabled)
      this.setState({
        validationErrors: []
      });
  }

  componentWillUnmount() {
    this._valueChanges.complete();
    window.removeEventListener('click', this.stopResize, false);
  }

  render() {
    return (
      <FormControl
        className={`textarea${this.props.className ? ' ' + this.props.className : ''}`}
        label={this.props.label}
        disabled={this.props.disabled}
        isInvalid={this.state.validationErrors.length !== 0}
        hint={this.props.hint}>
        <div
          ref={ref => this.inputBox = ref}
          className='textarea__input-box-container'>
          <div
            className='textarea__input-box'
            contentEditable={!this.props.readonly}
            suppressContentEditableWarning
            tabIndex={1}
            onKeyUp={this.onKeyUp}>
            {this.props.value}
          </div>
          <div
            className='textarea__input-box-resize-handle'
            onMouseDown={this.beginResize} />
        </div>
        <ValidationErrorMessages messages={this.state.validationErrors.map(error => error.errorMessage)} />
      </FormControl>
    );
  }

  onKeyUp(event: React.SyntheticEvent) {
    const value = (event.target as HTMLDivElement).textContent;
    this._valueChanges.next(value);
  }

  beginResize(event: React.MouseEvent) {
    document.body.classList.add('frozen');
    this._isResizing = true;
    this._initialClientX = event.clientX;
    this._initialClientY = event.clientY;
    this._inputBoxBoundingBox = this.inputBox.getBoundingClientRect();
  }

}
