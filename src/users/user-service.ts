import { User, CreateUserRequest } from './types';
import { getMockUsers, getMockUserById } from './mock-data';
import { createMetricsLRUCache } from '../cache';
import { BackgroundCleanupService } from '../cache';
import { UserNotFoundError } from './errors';
import PQueue from 'p-queue';
import { preventConcurrentRequests } from './concurrent-request-decorator';

export class UserService {
  private userCache: ReturnType<typeof createMetricsLRUCache<User>>;
  private cleanupService: BackgroundCleanupService;
  private databaseQueue: PQueue;
  private nextId = 4;

  constructor() {
    this.userCache = createMetricsLRUCache<User>({
      ttl: 60 * 1000, // 60 seconds
    });

    this.databaseQueue = new PQueue();

    this.cleanupService = new BackgroundCleanupService(this.userCache, {
      intervalMs: 2000,
      // onCleanup: (cleanedCount, currentSize) => {
      //   console.log(
      //     `🧹 User cache cleanup: removed ${cleanedCount} expired entries. Current size: ${currentSize}`
      //   );
      // },
      onError: (error: Error): void => {
        console.error(`❌ User cache cleanup error: ${error.message}`);
      },
    });

    this.cleanupService.start();
  }

  initializeCache(): void {
    console.log('🚀 Initializing user cache with mock data...');
    const mockUsers = getMockUsers();
    for (const user of mockUsers) {
      this.userCache.set(user.id.toString(), user);
    }
    console.log(
      `📦 User cache initialized with ${this.userCache.size()} users`
    );
  }

  private async simulateDatabaseCall(id: number): Promise<User> {
    await new Promise(resolve => globalThis.setTimeout(resolve, 200));

    const mockUser = getMockUserById(id);
    if (!mockUser) {
      throw new UserNotFoundError(id);
    }

    return mockUser;
  }

  @preventConcurrentRequests
  async getUserById(id: number): Promise<User> {
    const userId = id.toString();

    const cachedUser = this.userCache.get(userId);
    if (cachedUser) {
      return cachedUser;
    }

    try {
      const user = await this.databaseQueue.add(
        () => this.simulateDatabaseCall(id),
        { throwOnTimeout: true }
      );

      if (!this.userCache.has(userId)) {
        this.userCache.set(userId, user);
      }

      return user;
    } catch (error) {
      // Re-throw UserNotFoundError to maintain separation of concerns
      if (error instanceof UserNotFoundError) {
        throw error;
      }

      // Handle unexpected errors
      console.error(`Unexpected error while fetching user ${id}:`, error);
      throw new Error('Failed to fetch user data');
    }
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      ...userData,
    };
    this.userCache.set(newUser.id.toString(), newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return getMockUsers();
  }

  getCacheMetrics(): ReturnType<typeof this.userCache.getMetrics> {
    return this.userCache.getMetrics();
  }

  getCacheSize(): number {
    return this.userCache.size();
  }

  stopCleanup(): void {
    this.cleanupService.stop();
  }

  isCleanupActive(): boolean {
    return this.cleanupService.isActive();
  }
}
