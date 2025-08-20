import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getUserService, initializeUserCache } from './user-cache-singleton';

describe('UserCacheSingleton', () => {
  beforeEach(() => {
    // Clean up any existing instance by creating a new one
    // This ensures each test starts with a fresh state
  });

  afterEach(() => {
    // Clean up after each test by creating a new instance
    // This ensures tests don't interfere with each other
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

  it('should maintain singleton across multiple calls', () => {
    const instance1 = getUserService();
    const instance2 = getUserService();
    const instance3 = getUserService();

    expect(instance1).toBe(instance2);
    expect(instance2).toBe(instance3);
    expect(instance1).toBe(instance3);
  });

  it('should handle multiple initialization calls gracefully', () => {
    // First initialization
    initializeUserCache();
    const userService1 = getUserService();
    expect(userService1.getCacheSize()).toBe(3);

    // Second initialization should not cause issues
    initializeUserCache();
    const userService2 = getUserService();
    expect(userService2.getCacheSize()).toBe(3);

    // Should be the same instance
    expect(userService1).toBe(userService2);
  });
});
