import { Component, createRef } from 'react';
import { Subject } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import * as CodeMirror from 'codemirror';

import { FormControl } from '../form-control/FormControl';
import { FormControlModel } from '../models/FormControlModel';

import './TextArea.light.scss';
import './TextArea.dark.scss';

interface Props<T extends 'plaintext' | 'json' = 'json'> {
  label: string;
  formControlModel: T extends 'json' ? FormControlModel<Record<string, unknown>> : FormControlModel<string>;
  className?: string;
  readonly?: boolean;
  hint?: string;
  type?: T;
}

interface State {
}

export class TextArea<T extends 'plaintext' | 'json' = 'json'> extends Component<Props<T>, State> {

  readonly inputBoxContainerRef = createRef<HTMLDivElement>();
  readonly internalFormControl = new FormControlModel('', this.props.formControlModel.validators);

  // Hold the text value currently in the text box
  currentValueToDisplay: string;

  private readonly _textBoxValueStream = new Subject<string>();
  private readonly _unsubscriber = new Subject<void>();

  private _isResizing = false;
  // The x coordinate of the mousedown event when the user begins the resize
  private _initialClientX = 0;
  // The y coordinate of the mousedown event when the user begins the resize
  private _initialClientY = 0;
  private _inputBoxBoundingBox: ClientRect;
  private _codeMirror: CodeMirror.Editor = null;
  // Hold an object or a string that is used to compare whether the form control model's value was
  // changed from outside of this component, if it was, then we need to sync up this component
  // with the new value
  private _currentValueToCompare: string | Record<string, unknown>;

  constructor(props: Props<T>) {
    super(props);

    this._currentValueToCompare = props.formControlModel.getValue();
    this.currentValueToDisplay = this._stringifyValue(this._currentValueToCompare);

    this.beginResize = this.beginResize.bind(this);

    this._resize = this._resize.bind(this);
    this._stopResize = this._stopResize.bind(this);
    this._onValueChange = this._onValueChange.bind(this);
    this._onCodeMirrorEditorFocused = this._onCodeMirrorEditorFocused.bind(this);
    this._onCodeMirrorEditorFocusLost = this._onCodeMirrorEditorFocusLost.bind(this);
  }

  private _stringifyValue(value: string | Record<string, unknown>) {
    if (this.props.type === 'json') {
      return JSON.stringify(value, null, 4);
    }
    return value as string;
  }

  componentDidMount() {
    const formControlProp = this.props.formControlModel as FormControlModel<string | Record<string, unknown>>;
    this._inputBoxBoundingBox = this.inputBoxContainerRef.current.getBoundingClientRect();

    this._textBoxValueStream.pipe(
      takeUntil(this._unsubscriber),
      debounceTime(250)
    )
      .subscribe({
        next: value => {
          this.internalFormControl.setValue(value);
        }
      });

    this.internalFormControl.valueChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: value => {
          if (this.internalFormControl.isValid()) {
            this._currentValueToCompare = this.props.type === 'json' ? JSON.parse(value) : value;
            formControlProp.setValue(this._currentValueToCompare);
          }
        }
      });

    this.internalFormControl.validityChanges()
      .pipe(
        takeUntil(this._unsubscriber),
        filter(() => !this.internalFormControl.isPristine())
      )
      .subscribe({
        next: isValid => {
          formControlProp.setValidity(isValid);
          if (this._codeMirror) {
            if (!isValid) {
              const currentCursor = this._codeMirror.getCursor();
              const startCursor = {
                line: currentCursor.line,
                ch: 0
              };
              this._codeMirror.markText(startCursor, currentCursor).clear();
              this._codeMirror.markText(startCursor, currentCursor, { className: 'errored-line' });
            } else {
              for (const mark of this._codeMirror.getAllMarks()) {
                mark.clear();
              }
            }
          }
        }
      });

    formControlProp.valueChanges()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: value => {
          // This is true when this.props.formControlModel.setValue()
          // was called from outside of this component
          if (this._currentValueToCompare !== value) {
            this._currentValueToCompare = value;
            this.currentValueToDisplay = this._stringifyValue(value);
            if (this._codeMirror === null) {
              this._setupCodeMirrorEditor();
            } else {
              this._codeMirror.setValue(this.currentValueToDisplay);
            }
          }
        }
      });

    formControlProp.onDisableToggled()
      .pipe(takeUntil(this._unsubscriber))
      .subscribe({
        next: isDisabled => {
          if (isDisabled) {
            this.internalFormControl.disable();
          } else {
            this.internalFormControl.enable();
          }
        }
      });

    this._setupCodeMirrorEditor();

    window.addEventListener('mousemove', this._resize, false);
    window.addEventListener('mouseup', this._stopResize, false);
  }

  private _setupCodeMirrorEditor() {
    if (this.props.readonly && this.currentValueToDisplay === '') {
      return;
    }
    const inputBox = this.inputBoxContainerRef.current.querySelector('.textarea__input-box') as HTMLDivElement;
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
      value: this.currentValueToDisplay,
      lineNumbers: true,
      readOnly: this.props.readonly,
      mode: {
        name: 'javascript',
        json: true
      },
      indentUnit: 4
    });
    this._codeMirror.setOption('extraKeys', {
      Tab: codeMirror => {
        const spaces = ' '.repeat(codeMirror.getOption('indentUnit'));
        codeMirror.replaceSelection(spaces);
      }
    });
    this._codeMirror.on('change', this._onValueChange);
    this._codeMirror.on('focus', this._onCodeMirrorEditorFocused);
    this._codeMirror.on('blur', this._onCodeMirrorEditorFocusLost);
  }

  private _onValueChange(codeMirror: CodeMirror.Editor) {
    this.currentValueToDisplay = codeMirror.getValue();
    this._textBoxValueStream.next(codeMirror.getValue());
  }

  private _onCodeMirrorEditorFocused() {
    this.inputBoxContainerRef.current.querySelector('.textarea__input-box').classList.add('focused');
  }

  private _onCodeMirrorEditorFocusLost() {
    this.inputBoxContainerRef.current.querySelector('.textarea__input-box').classList.remove('focused');
  }

  private _resize(event: MouseEvent) {
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
      this.inputBoxContainerRef.current.setAttribute('style', styles.join(';'));
    }
  }

  private _stopResize() {
    this._isResizing = false;
    document.body.classList.remove('frozen');
  }

  componentWillUnmount() {
    this._unsubscriber.next();
    this._unsubscriber.complete();
    window.removeEventListener('mousemove', this._resize, false);
    window.removeEventListener('mouseup', this._stopResize, false);
    if (this._codeMirror) {
      this._codeMirror.off('change', this._onValueChange);
      this._codeMirror.off('focus', this._onCodeMirrorEditorFocused);
      this._codeMirror.off('blur', this._onCodeMirrorEditorFocusLost);
    }
  }

  render() {
    return (
      <FormControl
        className={`textarea${this.props.className ? ' ' + this.props.className : ''}`}
        formControlModel={this.internalFormControl}
        label={this.props.label}
        hint={this.props.hint}>
        <div
          ref={this.inputBoxContainerRef}
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
    this._inputBoxBoundingBox = this.inputBoxContainerRef.current.getBoundingClientRect();
  }

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(TextArea as any).defaultProps = {
  type: 'json'
} as Props;
