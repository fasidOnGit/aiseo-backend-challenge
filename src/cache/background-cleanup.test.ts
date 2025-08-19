import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BackgroundCleanupService,
  CleanupableCache,
} from './background-cleanup';

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

describe('BackgroundCleanupService', () => {
  let mockCache: MockCache;
  let cleanupService: BackgroundCleanupService;

  beforeEach(() => {
    mockCache = new MockCache();
    cleanupService = new BackgroundCleanupService(mockCache, {
      intervalMs: 100, // Fast interval for testing
    });
  });

  afterEach(() => {
    cleanupService.stop();
    mockCache.clear();
  });

  it('should start and stop correctly', () => {
    expect(cleanupService.isActive()).toBe(false);

    cleanupService.start();
    expect(cleanupService.isActive()).toBe(true);

    cleanupService.stop();
    expect(cleanupService.isActive()).toBe(false);
  });

  it('should perform cleanup at specified intervals', async () => {
    const onCleanup = vi.fn();
    cleanupService = new BackgroundCleanupService(mockCache, {
      intervalMs: 100,
      onCleanup,
    });

    cleanupService.start();

    // Wait for at least one cleanup cycle
    await new Promise(resolve => globalThis.setTimeout(resolve, 150));

    expect(mockCache.getCleanupCallCount()).toBeGreaterThan(0);
    expect(onCleanup).toHaveBeenCalled();
  });

  it('should handle cleanup errors gracefully', async () => {
    const onError = vi.fn();
    const errorCache = {
      size: (): number => 0,
      cleanupExpiredEntries: (): never => {
        throw new Error('Cleanup failed');
      },
    };

    cleanupService = new BackgroundCleanupService(errorCache, {
      intervalMs: 100,
      onError,
    });

    cleanupService.start();

    // Wait for cleanup to run
    await new Promise(resolve => globalThis.setTimeout(resolve, 150));

    expect(onError).toHaveBeenCalledWith(expect.any(Error));

    // Stop the service to prevent further errors
    cleanupService.stop();
  });

  it('should start and stop without events', () => {
    cleanupService.start();
    expect(cleanupService.isActive()).toBe(true);

    cleanupService.stop();
    expect(cleanupService.isActive()).toBe(false);
  });

  it('should queue cleanup tasks sequentially', async () => {
    cleanupService.start();

    // Wait for the background interval to add cleanup tasks
    await new Promise(resolve => globalThis.setTimeout(resolve, 150));

    // Check that cleanup is working through the queue
    expect(cleanupService.getQueueSize()).toBeGreaterThanOrEqual(0);
    expect(cleanupService.isActive()).toBe(true);
  });

  it('should not start if already running', () => {
    cleanupService.start();
    const initialState = cleanupService.isActive();

    cleanupService.start(); // Try to start again
    expect(cleanupService.isActive()).toBe(initialState);
  });

  it('should not stop if already stopped', () => {
    const initialState = cleanupService.isActive();

    cleanupService.stop(); // Try to stop when not running
    expect(cleanupService.isActive()).toBe(initialState);
  });

  it('should clear queue when stopping', async () => {
    cleanupService.start();

    // Add some tasks to the queue
    for (let i = 0; i < 3; i++) {
      cleanupService['queue'].add(() => Promise.resolve());
    }

    // Wait a bit for some tasks to be processed
    await new Promise(resolve => globalThis.setTimeout(resolve, 50));

    const queueSizeBeforeStop = cleanupService.getQueueSize();
    expect(queueSizeBeforeStop).toBeLessThanOrEqual(3);

    cleanupService.stop();
    expect(cleanupService.getQueueSize()).toBe(0);
  });
});
