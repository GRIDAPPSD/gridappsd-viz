import { AbstractControlModel } from '../models/AbstractControlModel';
import { DateTimeService } from '@shared/DateTimeService';
import { FormControlModel } from '../models/FormControlModel';

export type Validator = (control: AbstractControlModel<any>) => ValidationResult;

interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

const numberRegex = /^(?:-?\d+\.?\d*)?$/;
// YYYY-MM-DD HH:MM:SS[.LLL]
const dateTimePattern = /^(?:\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)?$/;
const dateTimeService = DateTimeService.getInstance();

export class Validators {

  static checkNotEmpty(subjectDisplayName: string): Validator {
    return control => {
      const value = control.getValue();
      return {
        isValid: value !== null && value !== undefined && String(value).trim() !== '',
        errorMessage: `${subjectDisplayName} must not be empty`
      };
    };
  }

  static checkValidJSON(subjectDisplayName: string): Validator {
    return (control: FormControlModel<string> | FormControlModel<object>) => {
      const value = control.getValue();
      if (value === null || value === undefined) {
        return {
          errorMessage: `${subjectDisplayName} is not a valid JSON`,
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
          errorMessage: `${subjectDisplayName} is not a valid JSON`,
          isValid: false
        };
      }
    };
  }

  static checkValidNumber(subjectDisplayName: string): Validator {
    return Validators._checkPattern(`${subjectDisplayName} must be a number`, numberRegex);
  }

  private static _checkPattern(errorMessage: string, pattern: RegExp): Validator {
    return (control: FormControlModel<number> | FormControlModel<string>) => ({
      isValid: pattern.test(String(control.getValue())),
      errorMessage
    });
  }

  static checkValidDateTime(subjectDisplayName: string): Validator {
    return (control: FormControlModel<number> | FormControlModel<string> | FormControlModel<Date>) => ({
      isValid: dateTimePattern.test(dateTimeService.format(control.getValue())),
      errorMessage: `${subjectDisplayName} must have format YYYY-MM-DD HH:MM:SS`
    });
  }

  static checkBetween(subjectDisplayName: string, min: number, max: number): Validator {
    return (control: FormControlModel<number>) => {
      const value = control.getValue();
      return {
        isValid: min <= value && value <= max,
        errorMessage: `${subjectDisplayName} must be between ${min} and ${max}`
      };
    };
  }

  static checkMin(subjectDisplayName: string, min: number): Validator {
    return (control: FormControlModel<number>) => ({
      isValid: control.getValue() >= min,
      errorMessage: `${subjectDisplayName} must be greater than or equal to ${min}`
    });
  }

  static checkMax(subjectDisplayName: string, max: number): Validator {
    return (control: FormControlModel<number>) => ({
      isValid: control.getValue() <= max,
      errorMessage: `${subjectDisplayName} must be less than or equal to ${max}`
    });
  }

}
