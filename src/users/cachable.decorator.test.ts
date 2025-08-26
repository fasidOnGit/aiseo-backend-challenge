import { describe, it, expect, beforeEach } from 'vitest';
import { Cachable } from '../cache/cachable';

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
});
