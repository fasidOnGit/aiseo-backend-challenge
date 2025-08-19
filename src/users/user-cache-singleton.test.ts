import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getUserService,
  initializeUserCache,
  shutdownUserCache,
} from './user-cache-singleton';

describe('UserCacheSingleton', () => {
  beforeEach(() => {
    // Clean up any existing instance
    shutdownUserCache();
  });

  afterEach(() => {
    // Clean up after each test
    shutdownUserCache();
  });

  it('should create singleton instance', () => {
    const userService1 = getUserService();
    const userService2 = getUserService();

    expect(userService1).toBe(userService2);
    expect(userService1).toBeDefined();
  });

  it('should initialize cache with mock data', async () => {
    await initializeUserCache();

    const userService = getUserService();
    expect(userService.getCacheSize()).toBe(3);
  });

  it('should shutdown cache and cleanup service', async () => {
    const userService = getUserService();

    // Verify cleanup is active
    expect(userService.isCleanupActive()).toBe(true);

    // Shutdown
    shutdownUserCache();

    // Get new instance
    const newUserService = getUserService();

    // Should be a different instance
    expect(newUserService).not.toBe(userService);

    // Cache should be empty
    expect(newUserService.getCacheSize()).toBe(0);
  });

  it('should maintain singleton across multiple calls', () => {
    const instance1 = getUserService();
    const instance2 = getUserService();
    const instance3 = getUserService();

    expect(instance1).toBe(instance2);
    expect(instance2).toBe(instance3);
    expect(instance1).toBe(instance3);
  });

  it('should handle multiple shutdown calls gracefully', () => {
    getUserService(); // Create instance

    // Multiple shutdowns should not cause issues
    shutdownUserCache();
    shutdownUserCache();
    shutdownUserCache();

    // Should still be able to get a new instance
    const newInstance = getUserService();
    expect(newInstance).toBeDefined();
  });
});
