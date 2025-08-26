import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { Initializer } from './index';

export interface QueueConfig {
  name: string;
  namespace?: string;
  concurrency?: number;
  // eslint-disable-next-line no-unused-vars
  processor: (job: Job) => Promise<unknown>;
}

// Global queue exports - assigned during initialization
export const globalQueues: Map<string, Queue> = new Map();
export const globalQueueEvents: Map<string, QueueEvents> = new Map();
export class BullMQInitializer implements Initializer {
  name = 'BullMQ';
  private redisClient: Redis;
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private postInitQueueConfigs: QueueConfig[] = [];

  constructor(redisClient: Redis) {
    this.redisClient = redisClient;
  }

  /**
   * Register a queue configuration to be set up after initialization
   */
  registerPostInitQueue(config: QueueConfig): void {
    this.postInitQueueConfigs.push(config);
  }

  async initialize(): Promise<void> {
    console.log('  📋 Setting up BullMQ queues and workers...');

    // Assign to global variables
    globalQueues.clear();
    globalQueueEvents.clear();

    // Set up post-initialization queues
    console.log('  📋 Setting up post-initialization queues...');
    for (const config of this.postInitQueueConfigs) {
      await this.setupQueue(config);

      // Update global exports for new queues
      const fullName = config.namespace
        ? `${config.namespace}_${config.name}`
        : config.name;

      const queue = this.queues.get(fullName);
      if (queue) {
        globalQueues.set(fullName, queue);

        const queueEvents = new QueueEvents(fullName, {
          connection: this.redisClient,
        });
        globalQueueEvents.set(fullName, queueEvents);
      }
    }
  }

  async cleanup(): Promise<void> {
    console.log('  📋 Cleaning up BullMQ queues and workers...');

    // Close all workers
    for (const [name, worker] of this.workers) {
      try {
        await worker.close();
        console.log(`    ✅ Worker ${name} closed`);
      } catch (error) {
        console.error(`    ❌ Error closing worker ${name}:`, error);
      }
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      try {
        await queue.obliterate();
        await queue.close();

        console.log(`    ✅ Queue ${name} closed`);
      } catch (error) {
        console.error(`    ❌ Error closing queue ${name}:`, error);
      }
    }

    // Close all queue events
    for (const [name, queueEvents] of globalQueueEvents) {
      try {
        await queueEvents.close();
        console.log(`    ✅ QueueEvents ${name} closed`);
      } catch (error) {
        console.error(`    ❌ Error closing QueueEvents ${name}:`, error);
      }
    }

    this.queues.clear();
    this.workers.clear();
    globalQueues.clear();
    globalQueueEvents.clear();
  }

  private async setupQueue(config: QueueConfig): Promise<void> {
    const fullName = config.namespace
      ? `${config.namespace}_${config.name}`
      : config.name;

    // Create queue
    const queue = new Queue(fullName, {
      connection: this.redisClient,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 1,
      },
    });

    // Create worker
    const worker = new Worker(fullName, config.processor, {
      connection: this.redisClient,
      concurrency: config.concurrency || 5,
    });

    // Handle worker events
    worker.on('completed', job => {
      console.log(`    ✅ Job ${job.id} completed in queue ${fullName}`);
    });

    worker.on('failed', (job, err) => {
      console.error(`    ❌ Job ${job?.id} failed in queue ${fullName}:`, err);
    });

    // Store references
    this.queues.set(fullName, queue);
    this.workers.set(fullName, worker);

    console.log(
      `    📋 Queue ${fullName} setup with concurrency ${config.concurrency || 1}`
    );
  }

  /**
   * Get a queue from global exports
   */
  static getGlobalQueue(name: string, namespace?: string): Queue | undefined {
    const fullName = namespace ? `${namespace}_${name}` : name;
    return globalQueues.get(fullName);
  }

  /**
   * Get QueueEvents from global exports
   */
  static getGlobalQueueEvents(
    name: string,
    namespace?: string
  ): QueueEvents | undefined {
    const fullName = namespace ? `${namespace}_${name}` : name;
    return globalQueueEvents.get(fullName);
  }
}
