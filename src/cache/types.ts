export interface LRUCacheOptions {
  ttl: number;
}

export interface LRUProvider<T> {
  // eslint-disable-next-line no-unused-vars
  has(key: string): boolean;
  // eslint-disable-next-line no-unused-vars
  get(key: string): T | undefined;
  // eslint-disable-next-line no-unused-vars
  set(key: string, value: T): void;
}

export interface SizableCache<T> extends LRUProvider<T> {
  size(): number;
}
