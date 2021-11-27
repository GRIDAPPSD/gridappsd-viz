import { Validator } from '../validation';

import { AbstractControlModel } from './AbstractControlModel';

export class FormControlModel<T> extends AbstractControlModel<T> {

  private _errors: string[] = null;

  private _currentValue: T;

  constructor(private readonly _initialValue: T, readonly validators: Validator[] = []) {
    super();

    this._currentValue = _initialValue;
    this._updateValue(_initialValue);
  }

  setValue(newValue: T) {
    this._isPristine = false;
    this._updateValue(newValue);
  }

  private _updateValue(newValue: T) {
    this._currentValue = newValue;
    this._isValid = this._validate();
    this._validityChangeNotifier.next(this._isValid);
    this._valueChangeNotifier.next(this._currentValue);
  }

  private _validate(): boolean {
    const failedValidations = this.validators.map(validator => validator(this)).filter(result => !result.isValid);
    if (failedValidations.length > 0) {
      this._errors = failedValidations.map(result => result.errorMessage);
      return false;
    } else {
      this._errors = null;
      return true;
    }
  }

  getValue() {
    return this._currentValue;
  }

  get errors() {
    return this._errors;
  }

  addValidator(validator: Validator) {
    this.validators.push(validator);
    const validationResult = validator(this);
    this._isValid = validationResult.isValid;
    if (!this._isValid) {
      if (!this._errors) {
        this._errors = [];
      }
      this._errors.push(validationResult.errorMessage);
    }
    this._validityChangeNotifier.next(this._isValid);
  }

  reset() {
    this._isPristine = true;
    this._updateValue(this._initialValue);
    this._validityChangeNotifier.next(this._isValid);
    this._valueChangeNotifier.next(this._currentValue);
    this._resetNotifier.next();
    this._disableStatusNotifier.next(this._isDisabled);
  }

}
