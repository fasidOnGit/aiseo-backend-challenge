import { createMetricsLRUCache } from '../cache';
import { BackgroundCleanupService } from '../cache/background-cleanup';
import { preventDistributedConcurrentRequests } from './distributed-concurrent-request-decorator';
import { User, CreateUserRequest } from './types';
import { UserRepository } from './user-repository';

export class UserService {
  private cache: ReturnType<typeof createMetricsLRUCache<User>>;
  private cleanupService: BackgroundCleanupService;
  private userRepository: UserRepository;

  constructor() {
    this.cache = createMetricsLRUCache<User>({
      ttl: 60 * 1000, // 1 minute
    });

    // Initialize background cleanup service
    this.cleanupService = new BackgroundCleanupService(this.cache);
    this.cleanupService.start();

    // Initialize user repository
    this.userRepository = new UserRepository();
  }

  /**
   * Get user by ID with distributed concurrency control
   * Uses 'users' namespace to avoid collisions with other services
   */
  @preventDistributedConcurrentRequests({ namespace: 'users' })
  async getUserById(id: number): Promise<User> {
    const cachedUser = this.cache.get(String(id));
    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.userRepository.getUserById(id);

    this.cache.set(String(id), user);

    return user;
  }

  /**
   * Check if cleanup service is active
   */
  isCleanupActive(): boolean {
    return this.cleanupService.isActive();
  }

  /**
   * Stop cleanup service
   */
  stopCleanup(): void {
    this.cleanupService.stop();
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const newUser = this.userRepository.createUser(userData);

    this.cache.set(String(newUser.id), newUser);

    return newUser;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.cleanupService.stop();
    this.cache.resetMetrics();
  }
}
