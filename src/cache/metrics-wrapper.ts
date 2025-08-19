import { SizableCache } from './types';
import { CacheMetricsCollector, CacheMetrics } from './metrics';
import { CleanupableCache } from './background-cleanup';

export interface WrappedCacheMetrics extends CacheMetrics {
  currentSize: number;
}

export class MetricsLRUWrapper<T> implements SizableCache<T>, CleanupableCache {
  private cache: SizableCache<T>;
  private metrics: CacheMetricsCollector;

  constructor(cache: SizableCache<T>) {
    this.cache = cache;
    this.metrics = new CacheMetricsCollector();
  }

  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  get(key: string): T | undefined {
    const result = this.cache.get(key);

    if (result !== undefined) {
      this.metrics.recordHit();
    } else {
      this.metrics.recordMiss();
    }

    return result;
  }

  has(key: string): boolean {
    const result = this.cache.has(key);

    if (result) {
      this.metrics.recordHit();
    } else {
      this.metrics.recordMiss();
    }

    return result;
  }

  size(): number {
    return this.cache.size();
  }

  getMetrics(): WrappedCacheMetrics {
    const metrics = this.metrics.getMetrics();
    const currentSize = this.cache.size();

    return {
      ...metrics,
      currentSize,
    };
  }

  resetMetrics(): void {
    this.metrics.resetMetrics();
  }

  cleanupExpiredEntries(): void {
    // Delegate cleanup to the wrapped cache
    if ('cleanupExpiredEntries' in this.cache) {
      (this.cache as CleanupableCache).cleanupExpiredEntries();
    }
  }
}
