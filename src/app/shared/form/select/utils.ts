import { Option } from './Option';

export function toOptions<T>(array: T[], labelExtractor: (item: T) => string): Option<T>[] {
  return array.map(item => new Option(labelExtractor(item), item));
}
