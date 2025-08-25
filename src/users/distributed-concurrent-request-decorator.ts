import {
  globalQueues,
  globalQueueEvents,
} from '../initializers/bullmq-initializer';

export interface DistributedConcurrentRequestOptions {
  namespace: string; // Required - no default
  queueName?: string;
}

/**
 * Distributed concurrent request decorator with namespace support
 * Namespace is required to avoid collisions between services
 */
export function preventDistributedConcurrentRequests<T extends unknown[], R>(
  options: DistributedConcurrentRequestOptions
) {
  return function (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const { namespace, queueName } = options;

    descriptor.value = async function (this: object, ...args: T): Promise<R> {
      // Get queue and queue events from global exports
      const queueNameToUse = queueName || propertyKey;
      const fullQueueName = `${namespace}:${queueNameToUse}`;

      const queue = globalQueues.get(fullQueueName);
      const queueEvents = globalQueueEvents.get(fullQueueName);

      if (!queue || !queueEvents) {
        // Fallback to direct execution if queue not available
        console.warn(
          `Queue not found: ${fullQueueName}, falling back to direct execution`
        );
        return originalMethod.apply(this, args);
      }

      try {
        const jobName = `${propertyKey}-${JSON.stringify(args)}`;

        // Add job to queue - BullMQ ensures only one job with same name runs at a time
        const job = await queue.add(jobName, { args });

        // Wait for completion using QueueEvents
        const result = await job.waitUntilFinished(queueEvents);

        if (result.failedReason) {
          throw new Error(result.failedReason);
        }

        return result.returnvalue as R;
      } catch (error) {
        // Fallback to direct execution if queue fails
        console.warn(
          `Queue execution failed for ${fullQueueName}, falling back to direct execution:`,
          error
        );
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}
