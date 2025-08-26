import { BullMQInitializer } from '../initializers/bullmq-initializer';
import { UserQueueProcessor } from './user-queue-processor';

/**
 * Initialize user-specific queues
 */
export function initializeUserQueues(
  bullmqInitializer: BullMQInitializer
): void {
  // Register getUserById queue for post-initialization setup
  const getUserByIdConfig = {
    name: 'getUserById',
    namespace: 'users',
    concurrency: 1,
    processor: UserQueueProcessor.getQueueConfig().processor,
  };
  bullmqInitializer.registerPostInitQueue(getUserByIdConfig);
}
