import { Node } from './node';

export class DoublyLinkedList<T> {
  private head: Node<T> | undefined;
  private tail: Node<T> | undefined;

  addToTail(key: string, value: T): Node<T> {
    const temp = new Node(key, value);

    if (this.head === undefined) {
      this.head = temp;
      this.tail = temp;
      return temp;
    }

    const oldTail = this.tail;
    if (oldTail) {
      oldTail.setNext(temp);
      temp.setPrev(oldTail);
    }

    this.tail = temp;
    return temp;
  }

  deleteHead(): Node<T> | undefined {
    if (this.head === undefined || this.head.getNext() === undefined) {
      const deleted = this.head;
      this.head = undefined;
      this.tail = undefined;
      return deleted;
    }

    const oldHead = this.head;
    const newHead = this.head.getNext();

    if (newHead) {
      newHead.setPrev(undefined);
    }
    oldHead.setNext(undefined);

    this.head = newHead;
    return oldHead;
  }

  removeNode(node: Node<T>): void {
    if (this.head === node && this.tail === node) {
      this.head = undefined;
      this.tail = undefined;
      return;
    }

    const prev = node.getPrev();
    const next = node.getNext();

    if (prev) {
      prev.setNext(next);
    }
    if (next) {
      next.setPrev(prev);
    }

    if (this.head === node) {
      this.head = next;
    }

    if (this.tail === node) {
      this.tail = prev;
    }
  }

  moveToTail(node: Node<T>): void {
    if (this.tail === node) {
      return;
    }

    const prev = node.getPrev();
    const next = node.getNext();

    if (prev) {
      prev.setNext(next);
    }
    if (next) {
      next.setPrev(prev);
    }

    if (this.head === node) {
      this.head = next;
    }

    if (this.tail) {
      this.tail.setNext(node);
    }
    node.setPrev(this.tail);
    node.setNext(undefined);
    this.tail = node;
  }
}
