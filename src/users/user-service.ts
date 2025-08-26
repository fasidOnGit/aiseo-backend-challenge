import { User, CreateUserRequest } from './types';
import { UserRepository } from './user-repository';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    // Initialize user repository
    this.userRepository = new UserRepository();
  }

  /**
   * Get user by ID
   */
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
