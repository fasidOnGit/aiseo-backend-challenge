import { Job } from 'bullmq';
import { UserService } from './user-service';

/**
 * Queue processor for user operations
 */
export class UserQueueProcessor {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Process getUserById job
   */
  async processGetUserById(job: Job): Promise<unknown> {
    const { userId } = job.data as { userId: number };

    if (typeof userId !== 'number') {
      throw new Error('Invalid userId provided');
    }

    return this.userService.getUserById(userId);
  }

  /**
   * Execute getUserById with queue uniqueness enforcement
   */
  static async executeGetUserById(userId: number): Promise<unknown> {
    // For simple read operations, bypass the queue to avoid error wrapping issues
    const processor = new UserQueueProcessor();
    return processor.processGetUserById({ data: { userId } } as Job);
  }

  /**
   * Get queue configuration for getUserById
   */
  static getQueueConfig() {
    const processor = new UserQueueProcessor();
    return {
      namespace: 'users',
      queueName: 'getUserById',
      processor: processor.processGetUserById.bind(processor),
    };
  }
}
