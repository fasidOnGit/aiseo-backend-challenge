import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { Redis } from 'ioredis';
import { RateLimitConfig, RateLimitResponse, RateLimitHeaders } from './types';

/**
 * Sophisticated rate limiting middleware with burst traffic handling
 *
 * Implements a two-tier rate limiting strategy:
 * - Minute limit: Maximum requests per minute
 * - Burst limit: Maximum requests in a short time window
 *
 * Uses Redis for distributed rate limiting across multiple instances
 */
export class RateLimitMiddleware {
  private minuteLimiter: RateLimiterRedis;
  private burstLimiter: RateLimiterRedis;
  private config: RateLimitConfig;

  constructor(redisClient: Redis, config: Partial<RateLimitConfig> = {}) {
    this.config = {
      minuteLimit: 10,
      minuteDuration: 60,
      burstLimit: 5,
      burstDuration: 10,
      blockDuration: 60,
      ...config,
    };

    this.minuteLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rlf:minute',
      points: this.config.minuteLimit,
      duration: this.config.minuteDuration,
      ...(this.config.blockDuration && {
        blockDuration: this.config.blockDuration,
      }),
    });

    this.burstLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rlf:burst',
      points: this.config.burstLimit,
      duration: this.config.burstDuration,
      ...(this.config.burstDuration && {
        blockDuration: this.config.burstDuration,
      }),
    });
  }

  /**
   * Get client identifier for rate limiting
   * Prioritizes IP address, falls back to connection remote address
   */
  private getClientKey(req: Request): string {
    return req.ip || req.connection?.remoteAddress || 'anonymous';
  }

  /**
   * Format rate limit exceeded response
   */
  private formatTooManyResponse(
    res: Response,
    label: 'minute' | 'burst',
    rateLimitRes: RateLimiterRes
  ): void {
    const retryAfter = Math.ceil(rateLimitRes.msBeforeNext / 1000);

    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      error: 'Too Many Requests',
      reason: this.getReasonMessage(label),
      retryInMs: rateLimitRes.msBeforeNext,
    } as RateLimitResponse);
  }

  /**
   * Get human-readable reason message for rate limit exceeded
   */
  private getReasonMessage(label: 'minute' | 'burst'): string {
    if (label === 'minute') {
      return `Rate limit exceeded: maximum ${this.config.minuteLimit} requests per ${this.config.minuteDuration} seconds.`;
    }
    return `Burst limit exceeded: maximum ${this.config.burstLimit} requests per ${this.config.burstDuration} seconds.`;
  }

  /**
   * Set rate limit headers for monitoring
   */
  private setRateLimitHeaders(
    res: Response,
    minuteRes: RateLimiterRes,
    burstRes: RateLimiterRes
  ): void {
    const headers: RateLimitHeaders = {
      'RateLimit-Limit-Minute': String(this.config.minuteLimit),
      'RateLimit-Remaining-Minute': String(minuteRes.remainingPoints),
      'RateLimit-Reset-Minute': String(
        Math.ceil(minuteRes.msBeforeNext / 1000)
      ),
      'RateLimit-Limit-Burst': String(this.config.burstLimit),
      'RateLimit-Remaining-Burst': String(burstRes.remainingPoints),
      'RateLimit-Reset-Burst': String(Math.ceil(burstRes.msBeforeNext / 1000)),
    };

    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  /**
   * Express middleware function that enforces rate limits
   */
  middleware = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const clientKey = this.getClientKey(req);

    try {
      // Consume from both rate limiters simultaneously
      const [burstRes, minuteRes] = await Promise.all([
        this.burstLimiter.consume(clientKey),
        this.minuteLimiter.consume(clientKey),
      ]);

      // Both limits are satisfied, set headers and continue
      this.setRateLimitHeaders(res, minuteRes, burstRes);
      next();
    } catch (error) {
      // Check if the error is a RateLimiterRes (rate limit exceeded)
      if (error && typeof error === 'object' && 'remainingPoints' in error) {
        const rateLimitError = error as RateLimiterRes;

        // Determine which limit was exceeded based on the error source
        // Since we can't easily determine which limiter threw the error,
        // we'll use the msBeforeNext to determine the label
        // Minute limit has longer duration (60s) vs burst limit (10s)
        const label = rateLimitError.msBeforeNext > 10000 ? 'minute' : 'burst';
        return this.formatTooManyResponse(res, label, rateLimitError);
      }

      // Fail-open approach: if Redis is unavailable or other errors, allow the request
      // This prevents the rate limiter from taking down the service
      console.warn('Rate limiting failed, allowing request:', error);
      next();
    }
  };

  /**
   * Get current rate limit configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }
}
