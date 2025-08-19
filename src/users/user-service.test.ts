import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserService } from './user-service';
import { CreateUserRequest } from './types';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(() => {
    userService.stopCleanup();
  });

  it('should initialize cache with mock data', async () => {
    await userService.initializeCache();

    expect(userService.getCacheSize()).toBe(3);
    expect(userService.getUserById(1)).resolves.toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('should get user by ID from cache', async () => {
    await userService.initializeCache();

    const user = await userService.getUserById(1);
    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('should get user by ID from mock data if not in cache', async () => {
    const user = await userService.getUserById(1);
    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });

    // Should now be in cache
    expect(userService.getCacheSize()).toBe(1);
  });

  it('should return undefined for non-existent user', async () => {
    const user = await userService.getUserById(999);
    expect(user).toBeUndefined();
  });

  it('should create new user', async () => {
    const userData: CreateUserRequest = {
      name: 'Bob Wilson',
      email: 'bob@example.com',
    };

    const newUser = await userService.createUser(userData);

    expect(newUser).toEqual({
      id: 4,
      name: 'Bob Wilson',
      email: 'bob@example.com',
    });

    // Should be in cache
    expect(userService.getCacheSize()).toBe(1);
  });

  it('should get all users', async () => {
    const users = await userService.getAllUsers();

    expect(users).toHaveLength(3);
    expect(users).toEqual([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
    ]);
  });

  it('should provide cache metrics', () => {
    const metrics = userService.getCacheMetrics();

    expect(metrics).toHaveProperty('hits');
    expect(metrics).toHaveProperty('misses');
    expect(metrics).toHaveProperty('hitRate');
    expect(metrics).toHaveProperty('totalRequests');
  });

  it('should start and stop cleanup service', () => {
    expect(userService.isCleanupActive()).toBe(true);

    userService.stopCleanup();
    expect(userService.isCleanupActive()).toBe(false);
  });

  it('should handle multiple user creations with incrementing IDs', async () => {
    const user1 = await userService.createUser({
      name: 'User 1',
      email: 'user1@example.com',
    });

    const user2 = await userService.createUser({
      name: 'User 2',
      email: 'user2@example.com',
    });

    expect(user1.id).toBe(4);
    expect(user2.id).toBe(5);
  });
});
