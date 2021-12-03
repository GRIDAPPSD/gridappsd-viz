import { AbstractControlModel } from './AbstractControlModel';
import { FormControlModel } from './FormControlModel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class FormArrayModel<T = any> extends AbstractControlModel<T[]> {

  private readonly _invalidFormControls = new Set<AbstractControlModel<T>>();

  constructor(private _controls: AbstractControlModel<T>[] = []) {
    super();

    for (const control of _controls) {
      this._bindToControl(control);
    }
  }

  private _bindToControl(control: AbstractControlModel<T>) {
    control.validityChanges()
      .subscribe({
        next: () => this._onValidityChanged(control)
      });
    control.valueChanges()
      .subscribe({
        next: () => {
          this._valueChangeNotifier.next(this.getValue());
          this._isPristine = false;
        }
      });
    if (control.isInvalid()) {
      this._isValid = false;
    }
  }

  private _onValidityChanged(control: AbstractControlModel<T>) {
    if (control.isValid()) {
      this._invalidFormControls.delete(control);
    } else {
      this._invalidFormControls.add(control);
    }
    this._isValid = this._invalidFormControls.size === 0;
    this._validityChangeNotifier.next(this._isValid);
  }

  getValue() {
    return this._controls.map(control => control.getValue());
  }

  setValue(newValue: T[]) {
    for (let i = 0; i < newValue.length; i++) {
      if (i in this._controls) {
        this._controls[i].setValue(newValue[i]);
      } else {
        const control = new FormControlModel(newValue[i]);
        this._controls.push(control);
      }
    }
  }

  findControl<E extends AbstractControlModel<T> = FormControlModel<T>>(index: number): E {
    if (!(index in this._controls)) {
      throw new Error(`Index "${index}" does not exist in this form array model`);
    }
    return this._controls[index] as E;
  }

  cleanup() {
    super.cleanup();
    for (const control of this._controls) {
      control.cleanup();
    }
  }

  pushControl(control: AbstractControlModel<T>) {
    this._controls.push(control);
    this._bindToControl(control);
    if (control.isInvalid()) {
      this._validityChangeNotifier.next(false);
    }
  }

  removeControl(item: number | AbstractControlModel<T>) {
    const index = typeof item === 'number' ? item : this._controls.findIndex(e => e === item);
    const control = this._controls.splice(index, 1)[0];
    control?.cleanup();
    this._valueChangeNotifier.next(this.getValue());
  }

  removeAllControls() {
    for (const control of this._controls) {
      control.cleanup();
    }
    this._controls = [];
    this._valueChangeNotifier.next([]);
    this._invalidFormControls.clear();
  }

  reset() {
    this._isPristine = true;
    for (const control of this._controls) {
      control.reset();
    }
    this._resetNotifier.next();
  }

  disable() {
    super.disable();
    this._controls.forEach(control => control.disable());
  }

  enable() {
    super.enable();
    this._controls.forEach(control => control.enable());
  }

}
