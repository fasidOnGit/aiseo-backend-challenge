import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { RateLimitMiddleware } from './rate-limit-middleware';

// Mock rate-limiter-flexible
vi.mock('rate-limiter-flexible', () => ({
  RateLimiterRedis: vi.fn(),
  RateLimiterRes: class MockRateLimiterRes {
    constructor(public msBeforeNext: number = 0) {}
  },
}));

// Mock ioredis
vi.mock('ioredis', () => ({
  Redis: vi.fn(),
}));

// Mock Express types
const createMockRequest = (
  overrides: Partial<Request> = {}
): Partial<Request> => ({
  ip: '127.0.0.1',
  path: '/test',
  headers: {},
  connection: {
    remoteAddress: '127.0.0.1',
  } as unknown as Request['connection'],
  ...overrides,
});

const createMockResponse = (): Partial<Response> => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  setHeader: vi.fn().mockReturnThis(),
});

const createMockNext = (): NextFunction => vi.fn();

describe('RateLimitMiddleware', () => {
  let middleware: RateLimitMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockRedisClient: unknown;
  let mockMinuteLimiter: { consume: ReturnType<typeof vi.fn> };
  let mockBurstLimiter: { consume: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Reset environment variables
    delete process.env['NODE_ENV'];
    delete process.env['REDIS_HOST'];

    // Create mock Redis client
    mockRedisClient = {};

    // Create mock rate limiters
    mockMinuteLimiter = {
      consume: vi.fn(),
    };

    mockBurstLimiter = {
      consume: vi.fn(),
    };

    // Mock RateLimiterRedis constructor
    (RateLimiterRedis as any).mockImplementation((options: any) => {
      if (options.keyPrefix === 'rlf:minute') {
        return mockMinuteLimiter;
      }
      if (options.keyPrefix === 'rlf:burst') {
        return mockBurstLimiter;
      }
      return {};
    });

    middleware = new RateLimitMiddleware(mockRedisClient as any);
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create rate limiters with default configuration', () => {
      expect(RateLimiterRedis).toHaveBeenCalledTimes(2);

      // Check minute limiter configuration
      expect(RateLimiterRedis).toHaveBeenCalledWith(
        expect.objectContaining({
          keyPrefix: 'rlf:minute',
          points: 10,
          duration: 60,
        })
      );

      // Check burst limiter configuration
      expect(RateLimiterRedis).toHaveBeenCalledWith(
        expect.objectContaining({
          keyPrefix: 'rlf:burst',
          points: 5,
          duration: 10,
        })
      );
    });

    it('should allow custom configuration', () => {
      const customConfig = {
        minuteLimit: 20,
        burstLimit: 10,
        minuteDuration: 120,
        burstDuration: 30,
      };

      new RateLimitMiddleware(mockRedisClient as any, customConfig);

      expect(RateLimiterRedis).toHaveBeenCalledWith(
        expect.objectContaining({
          points: 20,
          duration: 120,
        })
      );

      expect(RateLimiterRedis).toHaveBeenCalledWith(
        expect.objectContaining({
          points: 10,
          duration: 30,
        })
      );
    });
  });

  describe('getClientKey', () => {
    it('should prioritize IP address', () => {
      const req = createMockRequest({ ip: '192.168.1.1' });
      const result = (middleware as any).getClientKey(req);
      expect(result).toBe('192.168.1.1');
    });

    it('should fall back to connection remote address', () => {
      const req = createMockRequest({
        ip: undefined,
        connection: { remoteAddress: '10.0.0.1' } as any,
      });
      const result = (middleware as any).getClientKey(req);
      expect(result).toBe('10.0.0.1');
    });

    it('should use anonymous as last resort', () => {
      const req = createMockRequest({
        ip: undefined,
        connection: {} as any,
      });
      const result = (middleware as any).getClientKey(req);
      expect(result).toBe('anonymous');
    });
  });

  describe('middleware', () => {
    it('should allow request when both limits are satisfied', async () => {
      const minuteRes = { remainingPoints: 9, msBeforeNext: 45000 };
      const burstRes = { remainingPoints: 4, msBeforeNext: 8000 };

      mockMinuteLimiter.consume.mockResolvedValue(minuteRes);
      mockBurstLimiter.consume.mockResolvedValue(burstRes);

      await middleware.middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'RateLimit-Limit-Minute',
        '10'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'RateLimit-Remaining-Minute',
        '9'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'RateLimit-Limit-Burst',
        '5'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'RateLimit-Remaining-Burst',
        '4'
      );
    });

    it('should block request when minute limit is exceeded', async () => {
      const minuteRes = new RateLimiterRes(30000);
      const burstRes = { remainingPoints: 4, msBeforeNext: 8000 };

      mockMinuteLimiter.consume.mockResolvedValue(minuteRes);
      mockBurstLimiter.consume.mockResolvedValue(burstRes);

      await middleware.middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        reason: 'Rate limit exceeded: maximum 10 requests per 60 seconds.',
        retryInMs: 30000,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block request when burst limit is exceeded', async () => {
      const minuteRes = { remainingPoints: 9, msBeforeNext: 45000 };
      const burstRes = new RateLimiterRes(5000);

      mockMinuteLimiter.consume.mockResolvedValue(minuteRes);
      mockBurstLimiter.consume.mockResolvedValue(burstRes);

      await middleware.middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too Many Requests',
        reason: 'Burst limit exceeded: maximum 5 requests per 10 seconds.',
        retryInMs: 5000,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should set Retry-After header when rate limit is exceeded', async () => {
      const minuteRes = new RateLimiterRes(30000);
      const burstRes = { remainingPoints: 4, msBeforeNext: 8000 };

      mockMinuteLimiter.consume.mockResolvedValue(minuteRes);
      mockBurstLimiter.consume.mockResolvedValue(burstRes);

      await middleware.middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', 30);
    });

    it('should handle Redis errors gracefully and allow request', async () => {
      mockMinuteLimiter.consume.mockRejectedValue(
        new Error('Redis connection failed')
      );

      await middleware.middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call both rate limiters with correct client key', async () => {
      const minuteRes = { remainingPoints: 9, msBeforeNext: 45000 };
      const burstRes = { remainingPoints: 4, msBeforeNext: 8000 };

      mockMinuteLimiter.consume.mockResolvedValue(minuteRes);
      mockBurstLimiter.consume.mockResolvedValue(burstRes);

      await middleware.middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockMinuteLimiter.consume).toHaveBeenCalledWith('127.0.0.1');
      expect(mockBurstLimiter.consume).toHaveBeenCalledWith('127.0.0.1');
    });
  });

  describe('getConfig', () => {
    it('should return a copy of the current configuration', () => {
      const config = middleware.getConfig();

      expect(config).toEqual({
        minuteLimit: 10,
        minuteDuration: 60,
        burstLimit: 5,
        burstDuration: 10,
        blockDuration: 60,
      });

      // Ensure it's a copy, not a reference
      config.minuteLimit = 999;
      expect(middleware.getConfig().minuteLimit).toBe(10);
    });
  });
});
