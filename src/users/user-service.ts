import { User, CreateUserRequest } from './types';
import { UserRepository } from './user-repository';
import { preventDistributedConcurrentRequests } from './distributed-concurrent-request-decorator';
import { Cachable } from './cachable.decorator';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    // Initialize user repository
    this.userRepository = new UserRepository();
  }

  /**
   * Get user by ID with distributed concurrency control and automatic caching
   * Uses 'users' namespace to avoid collisions with other services
   */
  @preventDistributedConcurrentRequests({ namespace: 'users' })
  @Cachable({ ttl: 60 * 1000 }) // 1 minute cache
  async getUserById(id: number): Promise<User> {
    return this.userRepository.getUserById(id);
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    return this.userRepository.createUser(userData);
  }
}
