import * as React from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { FormControl } from '../form-control/FormControl';
import { FormControlModel } from '../models/FormControlModel';

import './TextArea.light.scss';
import './TextArea.dark.scss';

interface Props {
  label: string;
  formControlModel: FormControlModel<string>;
  className?: string;
  readonly?: boolean;
  hint?: string;
}

interface State {
}

export class TextArea extends React.Component<Props, State> {

  inputBox: HTMLElement;
  currentValue: string;

  private readonly _valueChanges = new Subject<string>();

  private _isResizing = false;
  // The x coordinate of the mousedown event when the user begins the resize
  private _initialClientX = 0;
  // The y coordinate of the mousedown event when the user begins the resize
  private _initialClientY = 0;
  private _inputBoxBoundingBox: ClientRect;

  constructor(props: Props) {
    super(props);

    this.currentValue = props.formControlModel.getValue();

    this.resize = this.resize.bind(this);
    this.stopResize = this.stopResize.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
    this.beginResize = this.beginResize.bind(this);
  }

  componentDidMount() {
    this._inputBoxBoundingBox = this.inputBox.getBoundingClientRect();
    this.props.formControlModel.valueChanges()
      .subscribe({
        next: value => {
          // This is true when this.props.formControlModel.setValue()
          // was called from outside of this component, in that case
          // we want to update this component to reflect the new value
          if (this.currentValue !== value) {
            this.currentValue = value;
            this.forceUpdate();
          }
        }
      });

    this._valueChanges.pipe(debounceTime(250))
      .subscribe({
        next: value => {
          this.props.formControlModel.setValue(value);
        }
      });

    window.addEventListener('mousemove', this.resize, false);
    window.addEventListener('mouseup', this.stopResize, false);
  }

  resize(event: MouseEvent) {
    if (this._isResizing) {
      const styles = [];
      const newWidth = this._inputBoxBoundingBox.width + event.clientX - this._initialClientX;
      if (newWidth > 0 && newWidth + this._inputBoxBoundingBox.left < document.body.clientWidth) {
        styles.push(`width:${newWidth}px`);
      }
      const newHeight = this._inputBoxBoundingBox.height + event.clientY - this._initialClientY;
      if (newHeight > 0 && newHeight + this._inputBoxBoundingBox.top < document.body.clientHeight) {
        styles.push(`height:${newHeight}px;max-height:${newHeight}px`);
      }
      this.inputBox.setAttribute('style', styles.join(';'));
    }
  }

  stopResize() {
    this._isResizing = false;
    document.body.classList.remove('frozen');
  }

  componentWillUnmount() {
    this._valueChanges.complete();
    this.props.formControlModel.cleanup();
    window.removeEventListener('mousemove', this.resize, false);
    window.removeEventListener('mouseup', this.stopResize, false);
  }

  render() {
    return (
      <FormControl
        className={`textarea${this.props.className ? ' ' + this.props.className : ''}`}
        formControlModel={this.props.formControlModel}
        label={this.props.label}
        hint={this.props.hint}>
        <div
          ref={ref => this.inputBox = ref}
          className='textarea__input-box-container'>
          <div
            className='textarea__input-box'
            contentEditable={!this.props.readonly}
            suppressContentEditableWarning
            tabIndex={1}
            onBlur={this.onValueChange}>
            {this.currentValue}
          </div>
          <div className='textarea__input-box-focus-indicator' />
          <div
            className='textarea__input-box-resize-handle'
            onMouseDown={this.beginResize} />
        </div>
      </FormControl>
    );
  }

  onValueChange(event: React.SyntheticEvent) {
    this.currentValue = (event.target as HTMLDivElement).textContent;
    this._valueChanges.next(this.currentValue);
  }

  beginResize(event: React.MouseEvent) {
    document.body.classList.add('frozen');
    this._isResizing = true;
    this._initialClientX = event.clientX;
    this._initialClientY = event.clientY;
    this._inputBoxBoundingBox = this.inputBox.getBoundingClientRect();
  }

}
