import { Redis } from 'ioredis';
import { RateLimitMiddleware } from './rate-limit-middleware';
import { RateLimitConfig } from './types';

/**
 * Factory for creating rate limiting middleware instances
 *
 * Provides convenient methods to create pre-configured rate limiters
 * for different use cases and environments
 */
export class RateLimitFactory {
  /**
   * Create a production-ready rate limiter with Redis
   *
   * @param redisClient - Redis client instance
   * @param config - Optional custom configuration
   * @returns Configured rate limiting middleware
   */
  static createProductionLimiter(
    redisClient: Redis,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitMiddleware {
    return new RateLimitMiddleware(redisClient, {
      minuteLimit: 10,
      minuteDuration: 60,
      burstLimit: 5,
      burstDuration: 10,
      blockDuration: 60,
      ...config,
    });
  }

  /**
   * Create a strict rate limiter for sensitive endpoints
   *
   * @param redisClient - Redis client instance
   * @param config - Optional custom configuration
   * @returns Configured rate limiting middleware with stricter limits
   */
  static createStrictLimiter(
    redisClient: Redis,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitMiddleware {
    return new RateLimitMiddleware(redisClient, {
      minuteLimit: 5,
      minuteDuration: 60,
      burstLimit: 2,
      burstDuration: 10,
      blockDuration: 120,
      ...config,
    });
  }

  /**
   * Create a permissive rate limiter for public endpoints
   *
   * @param redisClient - Redis client instance
   * @param config - Optional custom configuration
   * @returns Configured rate limiting middleware with more permissive limits
   */
  static createPermissiveLimiter(
    redisClient: Redis,
    config: Partial<RateLimitConfig> = {}
  ): RateLimitMiddleware {
    return new RateLimitMiddleware(redisClient, {
      minuteLimit: 30,
      minuteDuration: 60,
      burstLimit: 15,
      burstDuration: 10,
      blockDuration: 30,
      ...config,
    });
  }

  /**
   * Create a custom rate limiter with specific configuration
   *
   * @param redisClient - Redis client instance
   * @param config - Custom configuration
   * @returns Configured rate limiting middleware
   */
  static createCustomLimiter(
    redisClient: Redis,
    config: RateLimitConfig
  ): RateLimitMiddleware {
    return new RateLimitMiddleware(redisClient, config);
  }
}
