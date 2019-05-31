export class Option<T = string> {
  constructor(readonly label: string, readonly value?: T) {
    this.value = value || label as any;
  }
}