import { BullMQInitializer } from '../initializers/bullmq-initializer';

export interface QueueOperationOptions {
  namespace: string;
  queueName: string;
  jobName: string;
  jobData: Record<string, unknown>;
}

/**
 * Utility class for handling queue-based operations with uniqueness enforcement
 */
export class QueueProcessorUtility {
  /**
   * Execute a job with uniqueness enforcement
   * Uses BullMQ's jobId to ensure each unique request gets a dedicated job
   */
  static async executeWithUniqueness(
    options: QueueOperationOptions
  ): Promise<unknown> {
    const { namespace, queueName, jobName, jobData } = options;
    const fullQueueName = `${namespace}_${queueName}`;

    // Get queue and queue events from global exports
    const queue = BullMQInitializer.getGlobalQueue(queueName, namespace);
    const queueEvents = BullMQInitializer.getGlobalQueueEvents(
      queueName,
      namespace
    );

    if (!queue || !queueEvents) {
      throw new Error(`Queue not found: ${fullQueueName}`);
    }

    try {
      // Create a new job with unique jobId
      const job = await queue.add(jobName, jobData, {
        jobId: jobName, // This ensures unique job ID
        removeOnComplete: true,
        removeOnFail: true,
      });

      // Wait for completion - this returns the actual result or throws on error
      return await job.waitUntilFinished(queueEvents);
    } catch (error) {
      // Preserve the original error if it's a known error type
      if (error instanceof Error && error.name !== 'Error') {
        throw error;
      }
      throw new Error(`Queue execution failed for ${fullQueueName}: ${error}`);
    }
  }
}
