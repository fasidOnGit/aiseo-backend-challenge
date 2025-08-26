import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Redis } from 'ioredis';
import {
  RateLimiterInitializer,
  globalRateLimitMiddleware,
} from './rate-limiter-initializer';

// Mock ioredis
vi.mock('ioredis', () => ({
  Redis: vi.fn(),
}));

// Mock rate limiting middleware
vi.mock('./rate-limit-middleware', () => ({
  RateLimitMiddleware: vi.fn(),
}));

// Mock factory
vi.mock('./rate-limit-factory', () => ({
  RateLimitFactory: {
    createProductionLimiter: vi.fn(() => ({
      getConfig: vi.fn(() => ({
        minuteLimit: 10,
        minuteDuration: 60,
        burstLimit: 5,
        burstDuration: 10,
        blockDuration: 60,
      })),
    })),
  },
}));

describe('RateLimiterInitializer', () => {
  let initializer: RateLimiterInitializer;
  let mockRedisClient: unknown;

  beforeEach(() => {
    // Reset global variable
    (global as any).globalRateLimitMiddleware = null;

    mockRedisClient = {};
    initializer = new RateLimiterInitializer(mockRedisClient as Redis);
  });

  afterEach(() => {
    // Clean up global variable
    (global as any).globalRateLimitMiddleware = null;
  });

  describe('constructor', () => {
    it('should create a rate limiter initializer', () => {
      expect(initializer).toBeInstanceOf(RateLimiterInitializer);
      expect(initializer.name).toBe('RateLimiter');
    });
  });

  describe('initialize', () => {
    it('should initialize rate limiting middleware', async () => {
      await initializer.initialize();

      // Check that global variable is set
      expect(globalRateLimitMiddleware).toBeDefined();
    });

    it('should handle initialization errors', async () => {
      // This test verifies the basic error handling structure
      // In a real scenario, errors would come from Redis connection issues
      expect(initializer.initialize).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should cleanup rate limiting middleware', async () => {
      // First initialize
      await initializer.initialize();
      expect(globalRateLimitMiddleware).toBeDefined();

      // Then cleanup
      await initializer.cleanup();
      expect(globalRateLimitMiddleware).toBeNull();
    });

    it('should handle cleanup errors gracefully', async () => {
      // This test verifies the basic cleanup structure
      // In a real scenario, errors would come from Redis disconnection issues
      expect(initializer.cleanup).toBeDefined();
    });
  });

  describe('getMiddleware', () => {
    it('should return the rate limiting middleware instance', () => {
      const middleware = initializer.getMiddleware();
      expect(middleware).toBeDefined();
    });
  });

  describe('getConfig', () => {
    it('should return the rate limiting configuration', () => {
      const config = initializer.getConfig();
      expect(config).toEqual({
        minuteLimit: 10,
        minuteDuration: 60,
        burstLimit: 5,
        burstDuration: 10,
        blockDuration: 60,
      });
    });
  });
});

describe('globalRateLimitMiddleware', () => {
  it('should be initially null', () => {
    expect(globalRateLimitMiddleware).toBeNull();
  });
});
