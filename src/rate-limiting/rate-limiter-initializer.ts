import { Initializer } from '../initializers';
import { Redis } from 'ioredis';
import { RateLimitMiddleware } from './rate-limit-middleware';
import { RateLimitFactory } from './rate-limit-factory';

// Global rate limiting middleware - assigned during initialization
export let globalRateLimitMiddleware: RateLimitMiddleware | null = null;

/**
 * Rate Limiter Initializer
 *
 * Manages the lifecycle of rate limiting middleware and provides
 * a global instance for use throughout the application.
 */
export class RateLimiterInitializer implements Initializer {
  name = 'RateLimiter';
  private rateLimitMiddleware: RateLimitMiddleware;

  constructor(redisClient: Redis) {
    this.rateLimitMiddleware =
      RateLimitFactory.createProductionLimiter(redisClient);
  }

  async initialize(): Promise<void> {
    try {
      // Test rate limiting functionality
      // This could include testing Redis connectivity and rate limiter setup
      console.log('  🛡️  Rate limiting middleware initialized');

      // Assign to global variable for use in middlewares
      globalRateLimitMiddleware = this.rateLimitMiddleware;
    } catch (error) {
      throw new Error(`Failed to initialize rate limiting: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Clean up rate limiting resources if needed
      console.log('  🛡️  Rate limiting middleware cleaned up');

      // Clear global variable
      globalRateLimitMiddleware = null;
    } catch (error) {
      console.error('  ❌ Error cleaning up rate limiting middleware:', error);
    }
  }

  /**
   * Get the rate limiting middleware instance
   */
  getMiddleware(): RateLimitMiddleware {
    return this.rateLimitMiddleware;
  }

  /**
   * Get the current rate limiting configuration
   */
  getConfig() {
    return this.rateLimitMiddleware.getConfig();
  }
}
