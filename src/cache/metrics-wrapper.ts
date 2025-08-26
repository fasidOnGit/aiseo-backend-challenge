import { SizableCache, NamedCache, WrappedCacheMetrics } from './types';
import { CacheMetricsCollector } from './metrics';
import { CleanupableCache } from './background-cleanup';

export class MetricsLRUWrapper<T> implements NamedCache<T>, CleanupableCache {
  private cache: SizableCache<T>;
  private metrics: CacheMetricsCollector;
  private name: string;
  private responseTimes: number[] = [];
  private maxResponseTimeSamples = 100; // Keep last 100 response times for average calculation

  constructor(cache: SizableCache<T>, name: string) {
    this.cache = cache;
    this.metrics = new CacheMetricsCollector();
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  get(key: string): T | undefined {
    const startTime = Date.now();
    const result = this.cache.get(key);
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    this.recordResponseTime(responseTime);

    if (result !== undefined) {
      this.metrics.recordHit();
    } else {
      this.metrics.recordMiss();
    }

    return result;
  }

  has(key: string): boolean {
    const startTime = Date.now();
    const result = this.cache.has(key);
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    this.recordResponseTime(responseTime);

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
    const averageResponseTime = this.calculateAverageResponseTime();

    const result: WrappedCacheMetrics = {
      ...metrics,
      currentSize,
    };

    if (averageResponseTime !== undefined) {
      result.averageResponseTime = averageResponseTime;
    }

    return result;
  }

  resetMetrics(): void {
    this.metrics.resetMetrics();
    this.responseTimes = [];
  }

  cleanupExpiredEntries(): void {
    // Delegate cleanup to the wrapped cache
    if ('cleanupExpiredEntries' in this.cache) {
      (this.cache as CleanupableCache).cleanupExpiredEntries();
    }
  }

  private recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);

    // Keep only the last N samples to prevent memory growth
    if (this.responseTimes.length > this.maxResponseTimeSamples) {
      this.responseTimes = this.responseTimes.slice(
        -this.maxResponseTimeSamples
      );
    }
  }

  private calculateAverageResponseTime(): number | undefined {
    if (this.responseTimes.length === 0) {
      return undefined;
    }

    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.responseTimes.length;
  }
}
