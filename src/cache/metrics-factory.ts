import { LRUCacheOptions } from './types';
import { createLRUCacheProvider } from './lru-cache';
import { MetricsLRUWrapper } from './metrics-wrapper';

export function createMetricsLRUCache<T>(
  options: LRUCacheOptions
): MetricsLRUWrapper<T> {
  const baseCache = createLRUCacheProvider<T>(options);
  return new MetricsLRUWrapper<T>(baseCache);
}

// Export the metrics types for convenience
export type { CacheMetrics, CacheMetricsProvider } from './metrics';
export { MetricsLRUWrapper } from './metrics-wrapper';
