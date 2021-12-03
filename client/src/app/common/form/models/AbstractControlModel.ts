import { Subject, BehaviorSubject } from 'rxjs';

export abstract class AbstractControlModel<T> {

  protected readonly _validityChangeNotifier = new BehaviorSubject<boolean>(true);
  protected readonly _valueChangeNotifier = new BehaviorSubject<T>(null);
  protected readonly _resetNotifier = new Subject<void>();
  protected readonly _disableStatusNotifier = new BehaviorSubject<boolean>(false);

  protected _isValid = true;
  protected _isPristine = true;
  protected _isDisabled = false;

  abstract getValue(): T;
  abstract setValue(newValue: T): void;
  abstract reset(): void;

  isPristine() {
    return this._isPristine;
  }

  markDirty() {
    this._isPristine = false;
  }

  isValid() {
    return this._isValid;
  }

  isInvalid() {
    return !this._isValid;
  }

  setValidity(isValid: boolean) {
    this._isValid = isValid;
    this._validityChangeNotifier.next(isValid);
  }

  validityChanges() {
    return this._validityChangeNotifier.asObservable();
  }

  valueChanges() {
    return this._valueChangeNotifier.asObservable();
  }

  cleanup() {
    this._validityChangeNotifier.complete();
    this._valueChangeNotifier.complete();
    this._resetNotifier.complete();
    this._disableStatusNotifier.complete();
  }

  dependsOn(anotherControl: AbstractControlModel<unknown>) {
    anotherControl.validityChanges()
      .subscribe({
        next: isValid => {
          this._isDisabled = !isValid;
          this._disableStatusNotifier.next(this._isDisabled);
        }
      });
    anotherControl.onDisableToggled()
      .subscribe({
        next: isDisabled => {
          if (isDisabled) {
            this._isDisabled = true;
            this._disableStatusNotifier.next(true);
          }
        }
      });
    anotherControl.onReset()
      .subscribe({
        next: () => this.reset()
      });
  }

  isDisabled() {
    return this._isDisabled;
  }

  disable() {
    this._isDisabled = true;
    this._disableStatusNotifier.next(true);
  }

  enable() {
    this._isDisabled = false;
    this._disableStatusNotifier.next(false);
  }

  onReset() {
    return this._resetNotifier.asObservable();
  }

  onDisableToggled() {
    return this._disableStatusNotifier.asObservable();
  }

}
