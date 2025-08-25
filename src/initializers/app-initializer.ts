import { appInitializer } from './index';
import { RedisInitializer } from './redis-initializer';
import { BullMQInitializer } from './bullmq-initializer';

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

    // Register BullMQ queues for user service
    bullmqInitializer.registerQueue({
      name: 'getUserById',
      namespace: 'users',
      concurrency: 1,
      processor: async job => {
        // This will be processed by the decorator
        return job.data;
      },
    });

    // Register initializers
    appInitializer.register(redisInitializer);
    appInitializer.register(bullmqInitializer);

    // Initialize all components
    await appInitializer.initialize();

    console.log('🚀 Application initialization completed successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    throw error; // Let the caller handle the error
  }
}
