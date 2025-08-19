import { LRUCacheOptions, SizableCache } from './types';
import { Node } from './node';
import { DoublyLinkedList } from './doubly-linked-list';
import { CleanupableCache } from './background-cleanup';

export function createLRUCacheProvider<T>(
  options: LRUCacheOptions
): SizableCache<T> & CleanupableCache {
  const lruMap = new Map<string, [Node<T>, number]>();
  const dll = new DoublyLinkedList<T>();

  function getActiveValue(key: string): Node<T> | undefined {
    const tuple = lruMap.get(key);
    if (!tuple) return undefined;

    const [node, expiry] = tuple;
    if (Date.now() > expiry) {
      // Remove expired node
      lruMap.delete(key);
      dll.removeNode(node);
      return undefined;
    }

    return node;
  }

  function refreshValue(key: string, node: Node<T>): void {
    setValue(key, node);
    dll.moveToTail(node);
  }

  function setValue(key: string, value: Node<T>): void {
    lruMap.set(key, [value, Date.now() + options.ttl]);
  }

  function getNode(key: string): Node<T> | undefined {
    const node = getActiveValue(key);
    if (node) {
      refreshValue(key, node);
    }

    return node;
  }

  return {
    set(key, value): void {
      const existingNode = getActiveValue(key);

      if (existingNode) {
        existingNode.setValue(value);
        refreshValue(key, existingNode);
        return;
      }

      const node = dll.addToTail(key, value);
      setValue(key, node);
    },

    get(key): T | undefined {
      const node = getNode(key);
      return node?.getValue();
    },

    has(key): boolean {
      const node = getNode(key);
      return !!node;
    },

    size(): number {
      return lruMap.size;
    },

    cleanupExpiredEntries(): void {
      const now = Date.now();
      const expiredKeys: string[] = [];

      for (const [key, [, expiry]] of lruMap.entries()) {
        if (now > expiry) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        const nodeData = lruMap.get(key);
        if (nodeData) {
          const [node] = nodeData;
          lruMap.delete(key);
          dll.removeNode(node);
        }
      }
    },
  };
}
