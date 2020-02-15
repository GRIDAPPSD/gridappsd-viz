import { Option } from './Option';

export class SelectionOptionBuilder<T> {

  private readonly _options: Option<T>[] = [];

  constructor(values: T[], labelExtractor: (value: T) => string = (value: T) => String(value)) {
    this._options = values.map(value => new Option(labelExtractor(value), value));
  }

  static defaultBuilder() {
    return new SelectionOptionBuilder([], null);
  }

  getOptions() {
    return this._options;
  }

  numberOfOptions() {
    return this._options.length;
  }

}
