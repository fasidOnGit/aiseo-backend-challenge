import { BullMQInitializer } from '../../initializers/bullmq-initializer';
import {
  BackgroundCleanupScheduler,
  BackgroundCleanupProcessor,
  CleanupableCache,
  CleanupOptions,
} from './background-cleanup';

/**
 * Factory for creating and managing background cleanup services
 */
export class BackgroundCleanupFactory {
  private static instance: BackgroundCleanupFactory;
  private schedulers = new Map<string, BackgroundCleanupScheduler>();
  private processors = new Map<string, BackgroundCleanupProcessor>();

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): BackgroundCleanupFactory {
    if (!BackgroundCleanupFactory.instance) {
      BackgroundCleanupFactory.instance = new BackgroundCleanupFactory();
    }
    return BackgroundCleanupFactory.instance;
  }

  /**
   * Create a background cleanup service for a specific cache
   */
  createCleanupService(
    cacheId: string,
    cache: CleanupableCache,
    options: CleanupOptions = {}
  ): {
    scheduler: BackgroundCleanupScheduler;
    processor: BackgroundCleanupProcessor;
  } {
    // Get the queue from BullMQ
    const queue = BullMQInitializer.getGlobalQueue(
      'background-cleanup',
      'cache'
    );

    if (!queue) {
      throw new Error('Background cleanup queue not initialized');
    }

    // Create scheduler
    const scheduler = new BackgroundCleanupScheduler(queue, options);

    // Create processor
    const processor = new BackgroundCleanupProcessor(cache, options);

    // Store references
    this.schedulers.set(cacheId, scheduler);
    this.processors.set(cacheId, processor);

    return { scheduler, processor };
  }

  /**
   * Get a scheduler by cache ID
   */
  getScheduler(cacheId: string): BackgroundCleanupScheduler | undefined {
    return this.schedulers.get(cacheId);
  }

  /**
   * Get a processor by cache ID
   */
  getProcessor(cacheId: string): BackgroundCleanupProcessor | undefined {
    return this.processors.get(cacheId);
  }

  /**
   * Start all schedulers
   */
  startAll(): void {
    for (const [cacheId, scheduler] of this.schedulers) {
      try {
        scheduler.start();
        console.log(
          `Started background cleanup scheduler for cache: ${cacheId}`
        );
      } catch (error) {
        console.error(`Failed to start scheduler for cache ${cacheId}:`, error);
      }
    }
  }

  /**
   * Stop all schedulers
   */
  stopAll(): void {
    for (const [cacheId, scheduler] of this.schedulers) {
      try {
        scheduler.stop();
        console.log(
          `Stopped background cleanup scheduler for cache: ${cacheId}`
        );
      } catch (error) {
        console.error(`Failed to stop scheduler for cache ${cacheId}:`, error);
      }
    }
  }

  /**
   * Get all active schedulers
   */
  getActiveSchedulers(): Map<string, BackgroundCleanupScheduler> {
    return new Map(
      Array.from(this.schedulers.entries()).filter(([, scheduler]) =>
        scheduler.isActive()
      )
    );
  }
}
