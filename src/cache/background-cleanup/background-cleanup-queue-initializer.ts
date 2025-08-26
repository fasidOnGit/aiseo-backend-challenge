import { BullMQInitializer } from '../../initializers/bullmq-initializer';
import { BackgroundCleanupFactory } from './background-cleanup-factory';

/**
 * Initialize background cleanup queues
 */
export function initializeBackgroundCleanupQueues(
  bullmqInitializer: BullMQInitializer
): void {
  // Register the background cleanup queue
  bullmqInitializer.registerPostInitQueue({
    name: 'background-cleanup',
    namespace: 'cache',
    concurrency: 1, // Ensure sequential processing
    processor: async job => {
      const { cacheId } = job.data;

      // Get the processor from the factory
      const factory = BackgroundCleanupFactory.getInstance();
      const processor = factory.getProcessor(cacheId);

      if (!processor) {
        throw new Error(`No processor found for cache: ${cacheId}`);
      }

      // Process the cleanup job
      await processor.processCleanupJob();

      return { success: true, cacheId };
    },
  });
}
