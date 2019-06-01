export class Option<T = string> {
  isSelected = false;

  constructor(readonly label: string, readonly value?: T) {
    this.value = value || label as any;
  }
}