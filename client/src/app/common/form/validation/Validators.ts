import { DateTimeService } from '@client:common/DateTimeService';

import { AbstractControlModel } from '../models/AbstractControlModel';
import { FormControlModel } from '../models/FormControlModel';

export type Validator = (control: AbstractControlModel<unknown>) => ValidationResult;

interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

const numberRegex = /^(?:-?\d+\.?\d*)?$/;
// YYYY-MM-DD HH:MM:SS[.LLL]
const dateTimePattern = /^(?:\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)?$/;
const dateTimeService = DateTimeService.getInstance();

export class Validators {

  static checkNotEmpty(controlLabel: string, errorMessage = `${controlLabel} must not be empty`): Validator {
    return control => {
      const value = control.getValue();
      return {
        isValid: value !== null && value !== undefined && String(value).trim() !== '',
        errorMessage
      };
    };
  }

  static checkValidJSON(controlLabel: string, errorMessage = `${controlLabel} is not a valid JSON`): Validator {
    return (control: FormControlModel<string> | FormControlModel<Record<string, unknown>>) => {
      const value = control.getValue();
      if (value === null || value === undefined) {
        return {
          errorMessage,
          isValid: false
        };
      }
      if (typeof value === 'object' || value === '') {
        return {
          errorMessage: '',
          isValid: true
        };
      }
      try {
        JSON.parse(value);
        return {
          isValid: true,
          errorMessage: ''
        };
      } catch {
        return {
          errorMessage,
          isValid: false
        };
      }
    };
  }

  static checkValidNumber(controlLabel: string, errorMessage = `${controlLabel} must be a number`): Validator {
    return Validators._checkPattern(errorMessage, numberRegex);
  }

  private static _checkPattern(errorMessage: string, pattern: RegExp): Validator {
    return (control: FormControlModel<number> | FormControlModel<string>) => ({
      isValid: pattern.test(String(control.getValue())),
      errorMessage
    });
  }

  static checkValidDateTime(controlLabel: string, errorMessage = `${controlLabel} must have format YYYY-MM-DD HH:MM:SS`): Validator {
    return (control: FormControlModel<number> | FormControlModel<string> | FormControlModel<Date>) => ({
      isValid: dateTimePattern.test(dateTimeService.format(control.getValue())),
      errorMessage
    });
  }

  static checkBetween(controlLabel: string, min: number, max: number, errorMessage = `${controlLabel} must be between ${min} and ${max}`): Validator {
    return (control: FormControlModel<number>) => {
      const value = control.getValue();
      return {
        isValid: min <= value && value <= max,
        errorMessage
      };
    };
  }

  static checkMin(controlLabel: string, min: number, errorMessage = `${controlLabel} must be greater than or equal to ${min}`): Validator {
    return (control: FormControlModel<number>) => ({
      isValid: control.getValue() >= min,
      errorMessage
    });
  }

  static checkMax(controlLabel: string, max: number, errorMessage = `${controlLabel} must be less than or equal to ${max}`): Validator {
    return (control: FormControlModel<number>) => ({
      isValid: control.getValue() <= max,
      errorMessage
    });
  }

}
