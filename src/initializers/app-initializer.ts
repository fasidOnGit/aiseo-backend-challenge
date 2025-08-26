import { appInitializer } from './index';
import { RedisInitializer } from './redis-initializer';
import { BullMQInitializer } from './bullmq-initializer';
import { RateLimiterInitializer } from '../rate-limiting/rate-limiter-initializer';
import { initializeUserQueues } from '../users/user-queue-initializer';
import { initializeBackgroundCleanupQueues } from '../cache/background-cleanup/background-cleanup-queue-initializer';

/**
 * Initialize all application components
 */
export async function initializeApp(): Promise<void> {
  try {
    // Register initializers
    const redisInitializer = new RedisInitializer();
    const bullmqInitializer = new BullMQInitializer(
      redisInitializer.getClient()
    );
    const rateLimiterInitializer = new RateLimiterInitializer(
      redisInitializer.getClient()
    );

    // Register initializers first
    appInitializer.register(redisInitializer);
    appInitializer.register(bullmqInitializer);
    appInitializer.register(rateLimiterInitializer);

    // Register user-specific queues for post-initialization setup
    initializeUserQueues(bullmqInitializer);

    // Register background cleanup queues for post-initialization setup
    initializeBackgroundCleanupQueues(bullmqInitializer);

    // Initialize all components
    await appInitializer.initialize();

    console.log('🚀 Application initialization completed successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    throw error; // Let the caller handle the error
  }
}
