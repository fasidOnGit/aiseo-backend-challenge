import { NamedCache, CacheRegistryStats } from './types';

/**
 * Global cache registry that tracks all named cache instances
 * Provides aggregated metrics for monitoring and debugging
 */
export class CacheRegistry {
  private static instance: CacheRegistry;
  private caches = new Map<string, NamedCache<unknown>>();

  private constructor() {}

  static getInstance(): CacheRegistry {
    if (!CacheRegistry.instance) {
      CacheRegistry.instance = new CacheRegistry();
    }
    return CacheRegistry.instance;
  }

  /**
   * Register a named cache instance
   */
  register<T>(name: string, cache: NamedCache<T>): void {
    this.caches.set(name, cache);
  }

  /**
   * Unregister a cache instance
   */
  unregister(name: string): void {
    this.caches.delete(name);
  }

  /**
   * Get a specific cache by name
   */
  getCache<T>(name: string): NamedCache<T> | undefined {
    return this.caches.get(name) as NamedCache<T> | undefined;
  }

  /**
   * Get all registered cache names
   */
  getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }

  /**
   * Get aggregated statistics for all caches
   */
  getStats(): CacheRegistryStats {
    const cacheEntries = Array.from(this.caches.entries());

    if (cacheEntries.length === 0) {
      return {
        totalCaches: 0,
        totalSize: 0,
        totalHits: 0,
        totalMisses: 0,
        overallHitRate: 0,
        caches: [],
      };
    }

    const cacheStats = cacheEntries.map(([name, cache]) => {
      const metrics = cache.getMetrics();
      const result: {
        name: string;
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
        totalRequests: number;
        averageResponseTime?: number;
      } = {
        name,
        size: metrics.currentSize,
        hits: metrics.hits,
        misses: metrics.misses,
        hitRate: metrics.hitRate,
        totalRequests: metrics.totalRequests,
      };

      if (metrics.averageResponseTime !== undefined) {
        result.averageResponseTime = metrics.averageResponseTime;
      }

      return result;
    });

    const totalSize = cacheStats.reduce((sum, cache) => sum + cache.size, 0);
    const totalHits = cacheStats.reduce((sum, cache) => sum + cache.hits, 0);
    const totalMisses = cacheStats.reduce(
      (sum, cache) => sum + cache.misses,
      0
    );
    const totalRequests = totalHits + totalMisses;
    const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      totalCaches: cacheEntries.length,
      totalSize,
      totalHits,
      totalMisses,
      overallHitRate,
      caches: cacheStats,
    };
  }

  /**
   * Reset metrics for all caches
   */
  resetAllMetrics(): void {
    for (const cache of this.caches.values()) {
      cache.resetMetrics();
    }
  }

  /**
   * Reset metrics for a specific cache
   */
  resetCacheMetrics(name: string): void {
    const cache = this.caches.get(name);
    if (cache) {
      cache.resetMetrics();
    }
  }
}
