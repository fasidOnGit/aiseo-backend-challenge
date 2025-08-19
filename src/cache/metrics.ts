export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

export interface CacheMetricsProvider {
  getMetrics(): CacheMetrics;
  resetMetrics(): void;
}

export class CacheMetricsCollector implements CacheMetricsProvider {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getMetrics(): CacheMetrics {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      totalRequests,
    };
  }

  resetMetrics(): void {
    this.hits = 0;
    this.misses = 0;
  }
}
