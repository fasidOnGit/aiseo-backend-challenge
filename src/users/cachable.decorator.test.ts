import { describe, it, expect, beforeEach } from 'vitest';
import { Cachable } from './cachable.decorator';

describe('Cachable Decorator', () => {
  class TestService {
    private callCount = 0;

    @Cachable({ ttl: 1000 })
    async getData(id: number): Promise<string> {
      this.callCount++;
      return `data-${id}`;
    }

    @Cachable({ ttl: 2000 })
    async getOtherData(name: string): Promise<string> {
      this.callCount++;
      return `other-${name}`;
    }

    getCallCount(): number {
      return this.callCount;
    }
  }

  let service: TestService;

  beforeEach(() => {
    service = new TestService();
  });

  it('should cache method results', async () => {
    // First call should execute the method
    const result1 = await service.getData(1);
    expect(result1).toBe('data-1');
    expect(service.getCallCount()).toBe(1);

    // Second call with same arguments should return cached result
    const result2 = await service.getData(1);
    expect(result2).toBe('data-1');
    expect(service.getCallCount()).toBe(1); // Should not increment
  });

  it('should generate different cache keys for different arguments', async () => {
    // Call with different arguments
    await service.getData(1);
    expect(service.getCallCount()).toBe(1);

    await service.getData(2);
    expect(service.getCallCount()).toBe(2); // Both should execute
  });

  it('should have isolated caches for different methods', async () => {
    // Call both methods
    await service.getData(1);
    expect(service.getCallCount()).toBe(1);

    await service.getOtherData('test');
    expect(service.getCallCount()).toBe(2);

    // Call again - should use cache
    await service.getData(1);
    await service.getOtherData('test');

    expect(service.getCallCount()).toBe(2); // Should not increment
  });

  it('should generate proper cache keys', async () => {
    // Call the methods first to create the cache instances
    await service.getData(1);
    await service.getOtherData('test');

    // The decorator should add cache properties
    expect(service).toHaveProperty('getDataCache');
    expect(service).toHaveProperty('getOtherDataCache');
  });

  it('should add cache management methods', async () => {
    // Should have methods to get cache stats
    expect(service).toHaveProperty('getGetDataCacheStats');
    expect(service).toHaveProperty('getGetOtherDataCacheStats');

    // Should have methods to clear cache
    expect(service).toHaveProperty('clearGetDataCache');
    expect(service).toHaveProperty('clearGetOtherDataCache');
  });
});
