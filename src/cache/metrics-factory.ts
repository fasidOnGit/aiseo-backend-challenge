import { LRUCacheOptions } from './types';
import { createLRUCacheProvider } from './lru-cache';
import { MetricsLRUWrapper } from './metrics-wrapper';
import { CacheRegistry } from './cache-registry';

export function createMetricsLRUCache<T>(
  options: LRUCacheOptions & { name: string }
): MetricsLRUWrapper<T> {
  const baseCache = createLRUCacheProvider<T>(options);
  const namedCache = new MetricsLRUWrapper<T>(baseCache, options.name);

  // Register the cache with the global registry
  CacheRegistry.getInstance().register(options.name, namedCache);

  return namedCache;
}

// Export the metrics types for convenience
export type { CacheMetrics, CacheMetricsProvider } from './metrics';
export { MetricsLRUWrapper } from './metrics-wrapper';
export { CacheRegistry } from './cache-registry';
