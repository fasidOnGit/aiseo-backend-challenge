import { Queue } from 'bullmq';

export interface CleanupOptions {
  intervalMs?: number;
  // eslint-disable-next-line no-unused-vars
  onCleanup?: (cleanedCount: number, currentSize: number) => void;
  // eslint-disable-next-line no-unused-vars
  onError?: (error: Error) => void;
}

export interface CleanupableCache {
  cleanupExpiredEntries(): void;
  size(): number;
}

export interface CleanupJobData {
  cacheId: string;
  timestamp: number;
}

/**
 * Service responsible for scheduling and managing background cache cleanup jobs
 */
export class BackgroundCleanupScheduler {
  private queue: Queue;
  private isRunning = false;
  private intervalId: ReturnType<typeof globalThis.setInterval> | null = null;
  private options: CleanupOptions;

  constructor(queue: Queue, options: CleanupOptions = {}) {
    this.queue = queue;
    const DEFAULT_INTERVAL_MS = 2000;
    this.options = {
      intervalMs: DEFAULT_INTERVAL_MS,
      ...options,
    };
  }

  /**
   * Start scheduling cleanup jobs at the specified interval
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    this.intervalId = globalThis.setInterval(() => {
      this.scheduleCleanupJob();
    }, this.options.intervalMs);
  }

  /**
   * Stop scheduling cleanup jobs
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      globalThis.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Schedule a cleanup job to be processed
   */
  private async scheduleCleanupJob(): Promise<void> {
    try {
      await this.queue.add('cleanup', {
        cacheId: 'default',
        timestamp: Date.now(),
      } as CleanupJobData);
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      if (this.options.onError) {
        this.options.onError(errorObj);
      }
    }
  }

  /**
   * Check if the scheduler is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get the current queue size
   */
  async getQueueSize(): Promise<number> {
    return this.queue.count();
  }

  /**
   * Get the number of pending jobs
   */
  async getPendingJobs(): Promise<number> {
    return this.queue.getWaiting().then(jobs => jobs.length);
  }
}

/**
 * Service responsible for processing cleanup jobs
 */
export class BackgroundCleanupProcessor {
  private cache: CleanupableCache;
  private options: CleanupOptions;

  constructor(cache: CleanupableCache, options: CleanupOptions = {}) {
    this.cache = cache;
    this.options = options;
  }

  /**
   * Process a cleanup job
   */
  async processCleanupJob(): Promise<void> {
    try {
      const beforeSize = this.cache.size();
      this.cache.cleanupExpiredEntries();
      const afterSize = this.cache.size();
      const cleanedCount = beforeSize - afterSize;

      if (this.options.onCleanup) {
        this.options.onCleanup(cleanedCount, afterSize);
      }
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));

      if (this.options.onError) {
        this.options.onError(errorObj);
      }

      // Re-throw to mark job as failed
      throw errorObj;
    }
  }
}
