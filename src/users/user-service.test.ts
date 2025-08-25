import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from './user-service';
import { UserNotFoundError } from './errors';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should get user by ID from cache', async () => {
    // First fetch should populate cache
    await userService.getUserById(1);

    // Second fetch should come from cache
    const user = await userService.getUserById(1);
    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('should throw UserNotFoundError for non-existent user', async () => {
    await expect(userService.getUserById(999)).rejects.toThrow(
      UserNotFoundError
    );
    await expect(userService.getUserById(999)).rejects.toThrow(
      'User with ID 999 not found'
    );
  });

  it('should have cache management methods', () => {
    // Call the method first to create the cache
    userService.getUserById(1);

    // Should have cache management methods
    expect(userService).toHaveProperty('getGetUserByIdCacheStats');
    expect(userService).toHaveProperty('clearGetUserByIdCache');
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
