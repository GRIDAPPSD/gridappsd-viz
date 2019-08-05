import { Option } from './Option';

export function removeOptionsWithIdenticalLabel<T>(options: Option<T>[]): Option<T>[] {
  const existingLabels = new Map<string, true>();
  return options.filter(option => {
    const found = existingLabels.has(option.label);
    if (!found)
      existingLabels.set(option.label, true);
    return !found;
  });
}

export function toOptions<T>(array: T[], labelExtractor: (item: T) => string): Option<T>[] {
  return array.map(item => new Option(labelExtractor(item), item));
}
