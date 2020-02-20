import * as React from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as CodeMirror from 'codemirror';

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

  inputBoxContainer: HTMLElement;
  currentValue: string;

  private readonly _valueChanges = new Subject<string>();

  private _isResizing = false;
  // The x coordinate of the mousedown event when the user begins the resize
  private _initialClientX = 0;
  // The y coordinate of the mousedown event when the user begins the resize
  private _initialClientY = 0;
  private _inputBoxBoundingBox: ClientRect;
  private _codeMirror: CodeMirror.Editor = null;

  constructor(props: Props) {
    super(props);

    this.currentValue = props.formControlModel.getValue();

    this.resize = this.resize.bind(this);
    this.stopResize = this.stopResize.bind(this);
    this.beginResize = this.beginResize.bind(this);

    this._onValueChange = this._onValueChange.bind(this);
    this._onCodeMirrorEditorFocused = this._onCodeMirrorEditorFocused.bind(this);
    this._onCodeMirrorEditorFocusLost = this._onCodeMirrorEditorFocusLost.bind(this);
  }

  componentDidMount() {
    this._inputBoxBoundingBox = this.inputBoxContainer.getBoundingClientRect();
    this._setupCodeMirrorEditor();
    this.props.formControlModel.valueChanges()
      .subscribe({
        next: value => {
          // This is true when this.props.formControlModel.setValue()
          // was called from outside of this component
          if (this.currentValue !== value) {
            this.currentValue = value;
            if (this._codeMirror === null) {
              this._setupCodeMirrorEditor();
            }
            this._codeMirror.setValue(value);
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

  private _setupCodeMirrorEditor() {
    if (this.props.readonly && this.currentValue === '') {
      return;
    }
    const inputBox = this.inputBoxContainer.querySelector('.textarea__input-box') as HTMLDivElement;
    this._initializeCodeMirrorEditor(inputBox);
    // This is true when CodeMirror was successfully initialized, but for some
    // odd reason, the DOM doesn't get reflected with the layout changes created
    // by CodeMirror, so the height the CodeMirror wrapper element is 0, in this
    // case, we need to re-initialize it after a timeout
    if (this._codeMirror.getWrapperElement().clientHeight === 0) {
      this._codeMirror.off('change', this._onValueChange);
      this._codeMirror.off('focus', this._onCodeMirrorEditorFocused);
      this._codeMirror.off('blur', this._onCodeMirrorEditorFocusLost);
      inputBox.removeChild(this._codeMirror.getWrapperElement());
      setTimeout(() => this._initializeCodeMirrorEditor(inputBox), 500);
    }
  }

  private _initializeCodeMirrorEditor(insertionSlot: HTMLDivElement) {
    this._codeMirror = CodeMirror(insertionSlot, {
      value: this.currentValue,
      lineNumbers: true,
      readOnly: this.props.readonly,
      mode: {
        name: 'javascript',
        json: true
      }
    });
    this._codeMirror.on('change', this._onValueChange);
    this._codeMirror.on('focus', this._onCodeMirrorEditorFocused);
    this._codeMirror.on('blur', this._onCodeMirrorEditorFocusLost);
  }

  private _onValueChange(codeMirror: CodeMirror.Editor, _: any) {
    this.currentValue = codeMirror.getValue();
    this._valueChanges.next(codeMirror.getValue());
  }

  private _onCodeMirrorEditorFocused() {
    this.inputBoxContainer.querySelector('.textarea__input-box').classList.add('focused');
  }

  private _onCodeMirrorEditorFocusLost() {
    this.inputBoxContainer.querySelector('.textarea__input-box').classList.remove('focused');
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
      this.inputBoxContainer.setAttribute('style', styles.join(';'));
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
    this._codeMirror.off('change', this._onValueChange);
    this._codeMirror.off('focus', this._onCodeMirrorEditorFocused);
    this._codeMirror.off('blur', this._onCodeMirrorEditorFocusLost);
  }

  render() {
    return (
      <FormControl
        className={`textarea${this.props.className ? ' ' + this.props.className : ''}`}
        formControlModel={this.props.formControlModel}
        label={this.props.label}
        hint={this.props.hint}>
        <div
          ref={ref => this.inputBoxContainer = ref}
          className='textarea__input-box-container'>
          <div className='textarea__input-box' />
          <div className='textarea__input-box-focus-indicator' />
          <div
            className='textarea__input-box-resize-handle'
            onMouseDown={this.beginResize} />
        </div>
      </FormControl>
    );
  }

  beginResize(event: React.MouseEvent) {
    document.body.classList.add('frozen');
    this._isResizing = true;
    this._initialClientX = event.clientX;
    this._initialClientY = event.clientY;
    this._inputBoxBoundingBox = this.inputBoxContainer.getBoundingClientRect();
  }

}
