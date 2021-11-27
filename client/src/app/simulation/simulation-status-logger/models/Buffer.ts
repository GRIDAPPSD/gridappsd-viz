export class Buffer<T> {

  private readonly _buffer = new Array(this._capacity);

  private _size = 0;
  private _currentIndex = 0;

  constructor(private readonly _capacity = 64) {

  }

  add(value: T) {
    this._buffer[this._currentIndex++] = value;
    this._size++;
  }

  clear() {
    for (let i = 0; i < this._size; i++) {
      this._buffer[i] = undefined;
    }
    this._currentIndex = 0;
    this._size = 0;
  }

  forEach(walker: (value: T) => void) {
    for (let i = 0; i < this._size; i++) {
      walker(this._buffer[i]);
    }
  }

  size() {
    return this._size;
  }

  isFull() {
    return this._size === this._capacity;
  }



}
