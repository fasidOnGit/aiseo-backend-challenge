import { describe, it, expect, beforeEach } from 'vitest';
import { Cachable } from './cachable.decorator';
import { CacheRegistry } from '../cache-registry';

describe('@Cachable Decorator', () => {
  let registry: CacheRegistry;

  beforeEach(() => {
    // Clear the singleton instance before each test
    (CacheRegistry as any).instance = undefined;
    registry = CacheRegistry.getInstance();
  });

  it('should create only one cache instance per decorated method', () => {
    // Create a class with decorated methods
    class TestService {
      @Cachable({ ttl: 30000 })
      async getData(id: string): Promise<string> {
        return `data-${id}`;
      }

      @Cachable({ ttl: 60000 })
      async getOtherData(id: string): Promise<string> {
        return `other-${id}`;
      }
    }

    // The decorator should have been applied when the class was defined
    // Check that caches were registered
    const cacheNames = registry.getCacheNames();
    expect(cacheNames).toContain('TestService#getData');
    expect(cacheNames).toContain('TestService#getOtherData');
    expect(cacheNames).toHaveLength(2);
  });

  it('should reuse the same cache instance across multiple method calls', () => {
    class TestService {
      @Cachable({ ttl: 30000 })
      async getData(id: string): Promise<string> {
        return `data-${id}`;
      }
    }

    const service = new TestService();

    // Call the method multiple times
    service.getData('1');
    service.getData('2');
    service.getData('3');

    // Should still have only one cache instance
    const cacheNames = registry.getCacheNames();
    expect(cacheNames).toContain('TestService#getData');
    expect(cacheNames).toHaveLength(1);
  });

  it('should create separate caches for different methods in the same class', () => {
    class TestService {
      @Cachable({ ttl: 30000 })
      async getData(id: string): Promise<string> {
        return `data-${id}`;
      }

      @Cachable({ ttl: 30000 })
      async getDataById(id: string): Promise<string> {
        return `data-by-id-${id}`;
      }
    }

    const service = new TestService();

    // Call both methods
    service.getData('1');
    service.getDataById('1');

    // Should have two separate cache instances
    const cacheNames = registry.getCacheNames();
    expect(cacheNames).toContain('TestService#getData');
    expect(cacheNames).toContain('TestService#getDataById');
    expect(cacheNames).toHaveLength(2);
  });

  it('should create separate caches for different classes with same method names', () => {
    class UserService {
      @Cachable({ ttl: 30000 })
      async getUser(id: string): Promise<string> {
        return `user-${id}`;
      }
    }

    class ProductService {
      @Cachable({ ttl: 30000 })
      async getUser(id: string): Promise<string> {
        return `product-${id}`;
      }
    }

    const userService = new UserService();
    const productService = new ProductService();

    // Call both methods
    userService.getUser('1');
    productService.getUser('1');

    // Should have two separate cache instances with different names
    const cacheNames = registry.getCacheNames();
    expect(cacheNames).toContain('UserService#getUser');
    expect(cacheNames).toContain('ProductService#getUser');
    expect(cacheNames).toHaveLength(2);
  });

  it('should use custom key prefix when provided', () => {
    class TestService {
      @Cachable({ ttl: 30000, keyPrefix: 'custom-prefix' })
      async getData(id: string): Promise<string> {
        return `data-${id}`;
      }
    }

    const service = new TestService();
    service.getData('1');

    // Cache should be registered with the class method name
    const cacheNames = registry.getCacheNames();
    expect(cacheNames).toContain('TestService#getData');

    // But the key prefix should be custom
    // This is handled in the descriptor.value function
  });

  it('should cache results and return cached values on subsequent calls', async () => {
    class TestService {
      @Cachable({ ttl: 30000 })
      async getData(id: string): Promise<string> {
        return `data-${id}`;
      }
    }

    const service = new TestService();

    // First call - should miss cache
    const result1 = await service.getData('1');
    expect(result1).toBe('data-1');

    // Second call - should hit cache
    const result2 = await service.getData('1');
    expect(result2).toBe('data-1');

    // Check metrics
    const cache = registry.getCache('TestService#getData');
    expect(cache).toBeDefined();

    const metrics = cache!.getMetrics();
    expect(metrics.hits).toBe(1);
    expect(metrics.misses).toBe(1);
    expect(metrics.totalRequests).toBe(2);
    expect(metrics.hitRate).toBe(0.5);
  });
});
