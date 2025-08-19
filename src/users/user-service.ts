import { User, CreateUserRequest } from './types';
import { getMockUsers, getMockUserById } from './mock-data';
import { createMetricsLRUCache } from '../cache';
import { BackgroundCleanupService } from '../cache';

export class UserService {
  private userCache: ReturnType<typeof createMetricsLRUCache<User>>;
  private cleanupService: BackgroundCleanupService;
  private nextId = 4;

  constructor() {
    this.userCache = createMetricsLRUCache<User>({
      ttl: 60 * 1000, // 60 seconds
    });

    this.cleanupService = new BackgroundCleanupService(this.userCache, {
      intervalMs: 2000,
      onCleanup: (cleanedCount, currentSize) => {
        console.log(
          `🧹 User cache cleanup: removed ${cleanedCount} expired entries. Current size: ${currentSize}`
        );
      },
      onError: error => {
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

  async getUserById(id: number): Promise<User | undefined> {
    const userId = id.toString();
    const cachedUser = this.userCache.get(userId);
    if (cachedUser) {
      return cachedUser;
    }
    const mockUser = getMockUserById(id);
    if (mockUser) {
      this.userCache.set(userId, mockUser);
      return mockUser;
    }
    return undefined;
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

  getCacheMetrics() {
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
