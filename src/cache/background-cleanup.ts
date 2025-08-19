import PQueue from 'p-queue';

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

export class BackgroundCleanupService {
  private queue: PQueue;
  private isRunning = false;
  private intervalId: ReturnType<typeof globalThis.setInterval> | null = null;
  private cache: CleanupableCache;
  private options: CleanupOptions;

  constructor(cache: CleanupableCache, options: CleanupOptions = {}) {
    this.cache = cache;
    const DEFAULT_INTERVAL_MS = 2000;
    this.options = {
      intervalMs: DEFAULT_INTERVAL_MS,
      ...options,
    };

    // Create a queue with concurrency of 1 to ensure sequential cleanup
    this.queue = new PQueue({
      concurrency: 1,
      intervalCap: 1,
      interval: this.options.intervalMs ?? DEFAULT_INTERVAL_MS,
    });
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    const intervalId = globalThis.setInterval(() => {
      this.queue.add(() => this.performCleanup());
    }, this.options.intervalMs);

    this.intervalId = intervalId;
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      globalThis.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Wait for any pending cleanup tasks to complete
    this.queue.clear();
  }

  private async performCleanup(): Promise<void> {
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
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  getPendingTasks(): number {
    return this.queue.pending;
  }
}
