/**
 * A Deque implemented as a doubly linked list
 */
export class Deque<T> {

  private _front: Node<T> = null;
  private _back: Node<T> = null;
  private _numberOfNodes = 0;

  pushFront(value: T) {
    if (this._front === null) {
      this._front = new Node(value);
      this._back = this._front;
    } else {
      const newNode = new Node(value);
      newNode.next = this._front;
      this._front.previous = newNode;
      this._front = newNode;
    }
    this._numberOfNodes++;
  }

  pushBack(value: T) {
    if (this._back === null) {
      this._front = new Node(value);
      this._back = this._front;
    } else {
      const newNode = new Node(value);
      newNode.previous = this._back;
      this._back.next = newNode;
      this._back = newNode;
    }
    this._numberOfNodes++;
  }

  popBack() {
    this._back.previous.next = null;
    this._back = this._back.previous;
    this._numberOfNodes--;
  }

  clear() {
    this._front = null;
    this._back = null;
    this._numberOfNodes = 0;
  }

  toArray<T2>(mapper: (value: T) => T2) {
    const container = new Array(this._numberOfNodes) as T2[];
    let current = this._front;
    for (let i = 0; i < this._numberOfNodes; i++) {
      container[i] = mapper(current.value);
      current = current.next;
    }
    return container;
  }

  size() {
    return this._numberOfNodes;
  }

}

class Node<T> {

  previous: Node<T> = null;
  next: Node<T> = null;

  constructor(readonly value: T) {

  }

}
