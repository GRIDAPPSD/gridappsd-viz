export class PageChangeEvent<T> {
  constructor(readonly currentPage: Array<T>, readonly start: number, readonly count: number) {

  }
}
