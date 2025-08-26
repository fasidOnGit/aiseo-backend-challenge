export interface LRUCacheOptions {
  ttl: number;
  name?: string; // Add optional name parameter
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

// New interfaces for named caches and registry
export interface NamedCache<T> extends SizableCache<T> {
  getName(): string;
  getMetrics(): WrappedCacheMetrics;
  resetMetrics(): void;
}

export interface WrappedCacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  currentSize: number;
  averageResponseTime?: number;
}

export interface CacheRegistryStats {
  totalCaches: number;
  totalSize: number;
  totalHits: number;
  totalMisses: number;
  overallHitRate: number;
  caches: Array<{
    name: string;
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    totalRequests: number;
    averageResponseTime?: number;
  }>;
}
