/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractControlModel } from './AbstractControlModel';
import { FormControlModel } from './FormControlModel';

/**
 * This class represents a form group (form section) where there can be
 * one or more form fields, for example, a form section for a login screen
 * can be described using this class as followed:
 *
 * ```
 *    new FormGroupModel<{username: string; password: string;}>({
 *      username: new FormControlModel('', [Validators.checkNotEmpty('Username')]),
 *      password: new FormControlModel('', [Validators.checkNotEmpty('Password')])
 *    });
 * ```
 * <T> represents the type of data that form group describes, in the above
 * example of a login screen, <T> is `{username: string; password: string;}`
 */
export class FormGroupModel<T> extends AbstractControlModel<T> {

  private readonly _invalidFormControls = new Set<AbstractControlModel<any>>();
  private readonly _controls = new Map<string, AbstractControlModel<any>>();

  constructor(controls?: { [K in keyof T]: AbstractControlModel<T[K]> | T[K] }) {
    super();

    if (controls) {
      for (const [k, v] of Object.entries(controls)) {
        if (v instanceof AbstractControlModel) {
          this._bindToControl(k, v);
        } else {
          this._controls.set(k, new FormControlModel(v));
        }
      }
    }

  }

  private _bindToControl(controlName: string, control: AbstractControlModel<any>) {
    this._controls.set(controlName, control);
    control.validityChanges()
      .subscribe({
        next: () => this._onValidityChanged(control)
      });
    control.valueChanges()
      .subscribe({
        next: (value: any) => this._onControlValueChanged(controlName, value)
      });
    if (control.isInvalid()) {
      this._isValid = false;
    }
  }

  private _onValidityChanged(control: AbstractControlModel<any>) {
    if (control.isValid()) {
      this._invalidFormControls.delete(control);
    } else {
      this._invalidFormControls.add(control);
    }
    this._isValid = this._invalidFormControls.size === 0;
    this._validityChangeNotifier.next(this._isValid);
  }

  private _onControlValueChanged(controlName: string, value: any) {
    // When a child control is reset, its value triggers this callback
    // so we only want to update the _isPristine flag of this FormControlGroup
    // if the child control was not reset to its initial value
    if (!this._controls.get(controlName).isPristine()) {
      this._isPristine = false;
    }
    this._valueChangeNotifier.next({
      [controlName]: value
    } as any);
  }

  getValue() {
    const value = {} as T;
    for (const [controlName, control] of this._controls) {
      value[controlName] = control.getValue();
    }

    return value;
  }

  setValue<K extends keyof T = keyof T>(newValue: Pick<T, K>) {
    for (const [k, v] of Object.entries(newValue)) {
      if (this._controls.has(k)) {
        this._controls.get(k).setValue(v);
      } else {
        this._controls.set(k, new FormControlModel(v));
      }
    }
  }

  cleanup() {
    super.cleanup();
    this._controls.forEach(control => control.cleanup());
  }

  findControl<K extends keyof T = keyof T, E extends AbstractControlModel<T[K]> = FormControlModel<T[K]>>(paths: K & string): E {
    let control = this._controls.get(paths);
    if (!paths.includes('.')) {
      if (control === undefined) {
        throw new Error(`Unable to locate control with name "${paths}"`);
      }
      return control as any;
    }
    const controlPaths = paths.split('.');
    control = this._controls.get(controlPaths.shift());
    for (const controlPath of controlPaths) {
      if (control === undefined) {
        throw new Error(`Unable to locate control with name "${controlPath}" in property path "${paths}"`);
      }
      if (('findControl' in control)) {
        control = (control as any).findControl(controlPath);
      }
    }
    return control as any;
  }

  setControl<K extends keyof T = keyof T>(controlName: K & string, control: AbstractControlModel<T[K]>) {
    const existingControl = this._controls.get(controlName);
    if (existingControl) {
      existingControl.cleanup();
      this._invalidFormControls.delete(existingControl);
    }
    this._bindToControl(controlName, control);
    if (control.isInvalid()) {
      this._validityChangeNotifier.next(false);
    }
  }

  reset() {
    this._isPristine = true;
    this._controls.forEach(control => control.reset());
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
