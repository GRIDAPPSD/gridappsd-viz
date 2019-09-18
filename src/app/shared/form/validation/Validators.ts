import { ValidationResult } from './ValidationResult';

export type Validator = (value: string) => ValidationResult;

const numberRegex = /^(?:-?\d+\.?\d*)?$/;

// YYYY-MM-DD HH:MM:SS
const dateTimePattern = /^(?:\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})?$/;

export class Validators {

  static checkNotEmpty(errorMessage: string): Validator {
    return (value: string) => ({
      isValid: value && value.trim() !== '',
      errorMessage
    });
  }

  static checkValidJSON(errorMessage?: string): Validator {
    return (value: string) => {
      try {
        if (value !== '')
          JSON.parse(value);
        return {
          isValid: true,
          errorMessage: ''
        };
      } catch (e) {
        return {
          errorMessage: errorMessage || `Invalid JSON: ${e.message.replace('JSON.parse: ', '')}`,
          isValid: false
        };
      }
    };
  }

  static checkValidNumber(errorMessage: string): Validator {
    return Validators.checkPattern(errorMessage, numberRegex);
  }

  static checkValidDateTime(errorMessage: string): Validator {
    return Validators.checkPattern(errorMessage, dateTimePattern);
  }

  static checkPattern(errorMessage: string, pattern: RegExp): Validator {
    return (value: string) => ({
      isValid: pattern.test(value),
      errorMessage
    });
  }

}
