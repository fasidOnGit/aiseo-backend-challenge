import { describe, it, expect, beforeEach } from 'vitest';
import { createMetricsLRUCache } from './metrics-factory';
import { MetricsLRUWrapper } from './metrics-wrapper';

describe('Cache Metrics', () => {
  let metricsCache: MetricsLRUWrapper<string>;

  beforeEach(() => {
    metricsCache = createMetricsLRUCache<string>({
      ttl: 5000,
    });
  });

  describe('Basic Metrics Collection', () => {
    it('should start with zero metrics', () => {
      const metrics = metricsCache.getMetrics();

      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.currentSize).toBe(0);
      expect(metrics.hitRate).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });

    it('should record hits correctly', () => {
      metricsCache.set('key1', 'value1');
      metricsCache.get('key1'); // This should be a hit

      const metrics = metricsCache.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRate).toBe(1);
      expect(metrics.totalRequests).toBe(1);
    });

    it('should record misses correctly', () => {
      metricsCache.get('nonexistent'); // This should be a miss

      const metrics = metricsCache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0);
      expect(metrics.totalRequests).toBe(1);
    });

    it('should record mixed hits and misses', () => {
      metricsCache.set('key1', 'value1');
      metricsCache.get('key1'); // Hit
      metricsCache.get('key1'); // Hit
      metricsCache.get('nonexistent'); // Miss
      metricsCache.get('key1'); // Hit

      const metrics = metricsCache.getMetrics();
      expect(metrics.hits).toBe(3);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0.75);
      expect(metrics.totalRequests).toBe(4);
    });
  });

  describe('Cache Size Tracking', () => {
    it('should track current size correctly', () => {
      expect(metricsCache.getMetrics().currentSize).toBe(0);

      metricsCache.set('key1', 'value1');
      expect(metricsCache.getMetrics().currentSize).toBe(1);

      metricsCache.set('key2', 'value2');
      expect(metricsCache.getMetrics().currentSize).toBe(2);

      metricsCache.set('key3', 'value3');
      expect(metricsCache.getMetrics().currentSize).toBe(3);
    });

    it('should handle unlimited growth correctly', () => {
      metricsCache.set('key1', 'value1');
      metricsCache.set('key2', 'value2');
      metricsCache.set('key3', 'value3');
      metricsCache.set('key4', 'value4'); // No eviction since no limit

      const metrics = metricsCache.getMetrics();
      expect(metrics.currentSize).toBe(4); // Should be 4 since no limit
    });
  });

  describe('Has Operation Metrics', () => {
    it('should record hits and misses for has operations', () => {
      metricsCache.set('key1', 'value1');

      metricsCache.has('key1'); // Hit
      metricsCache.has('key1'); // Hit
      metricsCache.has('nonexistent'); // Miss

      const metrics = metricsCache.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.totalRequests).toBe(3);
    });
  });

  describe('Metrics Reset', () => {
    it('should reset metrics correctly', () => {
      metricsCache.set('key1', 'value1');
      metricsCache.get('key1'); // Hit
      metricsCache.get('nonexistent'); // Miss

      let metrics = metricsCache.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);

      metricsCache.resetMetrics();

      metrics = metricsCache.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.hitRate).toBe(0);
    });

    it('should not affect cache data when resetting metrics', () => {
      metricsCache.set('key1', 'value1');
      metricsCache.set('key2', 'value2');

      expect(metricsCache.get('key1')).toBe('value1');
      expect(metricsCache.get('key2')).toBe('value2');

      metricsCache.resetMetrics();

      // Cache data should still be there
      expect(metricsCache.get('key1')).toBe('value1');
      expect(metricsCache.get('key2')).toBe('value2');

      // But metrics should be reset
      const metrics = metricsCache.getMetrics();
      expect(metrics.hits).toBe(2); // These are new hits after reset
      expect(metrics.misses).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero requests correctly', () => {
      const metrics = metricsCache.getMetrics();
      expect(metrics.hitRate).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });

    it('should handle unlimited cache growth', () => {
      metricsCache.set('key1', 'value1');
      metricsCache.set('key2', 'value2');
      metricsCache.set('key3', 'value3');

      // Cache can grow without limit
      expect(metricsCache.getMetrics().currentSize).toBe(3);

      // Adding more items should increase size
      metricsCache.set('key4', 'value4');
      expect(metricsCache.getMetrics().currentSize).toBe(4); // No limit
    });
  });
});
