import { Initializer } from './index';
import { RedisOptions, Redis } from 'ioredis';

// Global Redis client - assigned during initialization
export let redisClient: Redis | null = null;

export class RedisInitializer implements Initializer {
  name = 'Redis';
  private redisClient: Redis;

  constructor() {
    this.redisClient = this.createRedisClient();
  }

  private createRedisClient(): Redis {
    const redisOptions: Record<string, unknown> = {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      db: parseInt(process.env['REDIS_DB'] || '0'),
      maxRetriesPerRequest: null,
    };

    if (process.env['REDIS_PASSWORD']) {
      redisOptions['password'] = process.env['REDIS_PASSWORD'];
    }

    return new Redis(redisOptions as RedisOptions);
  }

  async initialize(): Promise<void> {
    // Test Redis connection
    try {
      await this.redisClient.ping();
      console.log('  🔗 Redis connection established');

      // Assign to global variable
      redisClient = this.redisClient;
    } catch (error) {
      throw new Error(`Failed to connect to Redis: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.redisClient.flushdb();
      console.log('  🗑️  Redis database flushed');
      await this.redisClient.disconnect();
      console.log('  🔗 Redis connection closed');

      // Clear global variable
      redisClient = null;
    } catch (error) {
      console.error('  ❌ Error closing Redis connection:', error);
    }
  }

  /**
   * Get the Redis client instance
   */
  getClient(): Redis {
    return this.redisClient;
  }
}
