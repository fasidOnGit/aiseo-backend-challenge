import { User, CreateUserRequest } from './types';
import { getMockUsers } from './mock-data';
import { UserNotFoundError } from './errors';
import { Cachable } from '../cache/cachable';

export class UserRepository {
  private users: Map<number, User>;
  private nextUserId: number = 1;

  constructor() {
    this.users = new Map();
    this.populateFromMockData();
  }

  private populateFromMockData(): void {
    const mockUsers = getMockUsers();
    for (const user of mockUsers) {
      this.users.set(user.id, user);
    }
    this.nextUserId =
      mockUsers.length > 0 ? Math.max(...mockUsers.map(u => u.id)) + 1 : 1;
  }

  @Cachable({ ttl: 60 * 1000 }) // 1 minute cache
  async getUserById(id: number): Promise<User> {
    await new Promise(resolve => globalThis.setTimeout(resolve, 100));

    const user = this.users.get(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    return user;
  }

  createUser(userData: CreateUserRequest): User {
    const newUser: User = {
      id: this.nextUserId,
      ...userData,
    };

    this.users.set(this.nextUserId, newUser);
    this.nextUserId++;

    return newUser;
  }
}
