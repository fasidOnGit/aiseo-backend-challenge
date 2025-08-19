export class Node<T> {
  private next: Node<T> | undefined;
  private prev: Node<T> | undefined;
  private key: string;
  private value: T;

  constructor(key: string, value: T) {
    this.key = key;
    this.value = value;
  }

  getPrev(): Node<T> | undefined {
    return this.prev;
  }

  getNext(): Node<T> | undefined {
    return this.next;
  }

  getKey(): string {
    return this.key;
  }

  getValue(): T {
    return this.value;
  }

  setKey(key: string): void {
    this.key = key;
  }

  setValue(value: T): void {
    this.value = value;
  }

  setNext(next: Node<T> | undefined): void {
    this.next = next;
  }

  setPrev(prev: Node<T> | undefined): void {
    this.prev = prev;
  }
}
