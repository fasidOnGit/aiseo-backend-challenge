import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock BullMQInitializer before importing the modules that use it
vi.mock('../../initializers/bullmq-initializer', () => ({
  BullMQInitializer: {
    getGlobalQueue: vi.fn().mockReturnValue({
      add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
      count: vi.fn().mockResolvedValue(0),
      getWaiting: vi.fn().mockResolvedValue([]),
    }),
  },
}));

import {
  BackgroundCleanupScheduler,
  BackgroundCleanupProcessor,
  CleanupableCache,
} from './background-cleanup';
import { BackgroundCleanupFactory } from './background-cleanup-factory';

// Mock cache implementation for testing
class MockCache implements CleanupableCache {
  private items = new Map<string, { value: string; expiry: number }>();
  private cleanupCallCount = 0;

  set(key: string, value: string, expiry: number): void {
    this.items.set(key, { value, expiry });
  }

  get(key: string): string | undefined {
    const item = this.items.get(key);
    return item ? item.value : undefined;
  }

  has(key: string): boolean {
    return this.items.has(key);
  }

  size(): number {
    return this.items.size;
  }

  cleanupExpiredEntries(): void {
    this.cleanupCallCount++;
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, { expiry }] of this.items.entries()) {
      if (now > expiry) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.items.delete(key);
    }
  }

  getCleanupCallCount(): number {
    return this.cleanupCallCount;
  }

  clear(): void {
    this.items.clear();
    this.cleanupCallCount = 0;
  }
}

describe('BackgroundCleanupScheduler', () => {
  let scheduler: BackgroundCleanupScheduler;
  let mockQueue: any;

  beforeEach(() => {
    mockQueue = {
      add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
      count: vi.fn().mockResolvedValue(0),
      getWaiting: vi.fn().mockResolvedValue([]),
    };
    
    scheduler = new BackgroundCleanupScheduler(mockQueue, {
      intervalMs: 100, // Fast interval for testing
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('should start and stop correctly', () => {
    expect(scheduler.isActive()).toBe(false);

    scheduler.start();
    expect(scheduler.isActive()).toBe(true);

    scheduler.stop();
    expect(scheduler.isActive()).toBe(false);
  });

  it('should schedule cleanup jobs at specified intervals', async () => {
    const onError = vi.fn();
    scheduler = new BackgroundCleanupScheduler(mockQueue, {
      intervalMs: 100,
      onError,
    });

    scheduler.start();

    // Wait for at least one cleanup cycle
    await new Promise(resolve => globalThis.setTimeout(resolve, 150));

    expect(mockQueue.add).toHaveBeenCalledWith('cleanup', {
      cacheId: 'default',
      timestamp: expect.any(Number),
    });
  });

  it('should handle scheduling errors gracefully', async () => {
    const onError = vi.fn();
    const errorQueue = {
      add: vi.fn().mockRejectedValue(new Error('Queue error')),
      count: vi.fn().mockResolvedValue(0),
      getWaiting: vi.fn().mockResolvedValue([]),
    } as any;

    scheduler = new BackgroundCleanupScheduler(errorQueue, {
      intervalMs: 100,
      onError,
    });

    scheduler.start();

    // Wait for cleanup to run
    await new Promise(resolve => globalThis.setTimeout(resolve, 150));

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should not start if already running', () => {
    scheduler.start();
    const initialState = scheduler.isActive();

    scheduler.start(); // Try to start again
    expect(scheduler.isActive()).toBe(initialState);
  });

  it('should not stop if already stopped', () => {
    const initialState = scheduler.isActive();

    scheduler.stop(); // Try to stop when not running
    expect(scheduler.isActive()).toBe(initialState);
  });

  it('should get queue size and pending jobs', async () => {
    expect(await scheduler.getQueueSize()).toBe(0);
    expect(await scheduler.getPendingJobs()).toBe(0);
  });
});

describe('BackgroundCleanupProcessor', () => {
  let mockCache: MockCache;
  let processor: BackgroundCleanupProcessor;

  beforeEach(() => {
    mockCache = new MockCache();
    processor = new BackgroundCleanupProcessor(mockCache, {});
  });

  afterEach(() => {
    mockCache.clear();
  });

  it('should process cleanup job successfully', async () => {
    const onCleanup = vi.fn();
    processor = new BackgroundCleanupProcessor(mockCache, { onCleanup });

    // Add some test data
    mockCache.set('key1', 'value1', Date.now() + 1000);
    mockCache.set('key2', 'value2', Date.now() - 1000); // Expired

    const beforeSize = mockCache.size();
    await processor.processCleanupJob();
    const afterSize = mockCache.size();

    expect(afterSize).toBeLessThan(beforeSize);
    expect(onCleanup).toHaveBeenCalledWith(1, afterSize);
  });

  it('should handle cleanup errors gracefully', async () => {
    const onError = vi.fn();
    const errorCache = {
      size: (): number => 0,
      cleanupExpiredEntries: (): never => {
        throw new Error('Cleanup failed');
      },
    };

    processor = new BackgroundCleanupProcessor(errorCache as any, { onError });

    await expect(processor.processCleanupJob()).rejects.toThrow('Cleanup failed');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('BackgroundCleanupFactory', () => {
  beforeEach(() => {
    // Reset singleton instance
    (BackgroundCleanupFactory as any).instance = undefined;
  });

  it('should create singleton instance', () => {
    const instance1 = BackgroundCleanupFactory.getInstance();
    const instance2 = BackgroundCleanupFactory.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('should create cleanup service for cache', () => {
    const factory = BackgroundCleanupFactory.getInstance();
    const mockCache = new MockCache();
    
    const { scheduler, processor } = factory.createCleanupService('test-cache', mockCache);
    
    expect(scheduler).toBeInstanceOf(BackgroundCleanupScheduler);
    expect(processor).toBeInstanceOf(BackgroundCleanupProcessor);
  });

  it('should manage multiple cache services', () => {
    const factory = BackgroundCleanupFactory.getInstance();
    const mockCache1 = new MockCache();
    const mockCache2 = new MockCache();
    
    factory.createCleanupService('cache1', mockCache1);
    factory.createCleanupService('cache2', mockCache2);
    
    expect(factory.getScheduler('cache1')).toBeDefined();
    expect(factory.getScheduler('cache2')).toBeDefined();
    expect(factory.getProcessor('cache1')).toBeDefined();
    expect(factory.getProcessor('cache2')).toBeDefined();
  });
});
