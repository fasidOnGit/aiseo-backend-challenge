import { describe, it, expect, beforeEach } from 'vitest';
import { UserRepository } from './user-repository';
import { CreateUserRequest } from './types';
import { UserNotFoundError } from './errors';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  it('should populate with mock data on instantiation', async () => {
    // Check that we can get the expected users
    const user1 = await userRepository.getUserById(1);
    expect(user1).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });

    const user2 = await userRepository.getUserById(2);
    expect(user2).toEqual({
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
    });

    const user3 = await userRepository.getUserById(3);
    expect(user3).toEqual({
      id: 3,
      name: 'Alice Johnson',
      email: 'alice@example.com',
    });
  });

  it('should get user by ID', async () => {
    const user = await userRepository.getUserById(2);
    expect(user).toEqual({
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
    });
  });

  it('should throw UserNotFoundError for non-existent user', async () => {
    await expect(userRepository.getUserById(999)).rejects.toThrow(
      UserNotFoundError
    );
  });

  it('should create new user with auto-incrementing ID', async () => {
    const userData: CreateUserRequest = {
      name: 'Bob Wilson',
      email: 'bob@example.com',
    };

    const newUser = userRepository.createUser(userData);
    expect(newUser).toEqual({
      id: 4,
      name: 'Bob Wilson',
      email: 'bob@example.com',
    });

    // Verify the user was added by trying to retrieve it
    const retrievedUser = await userRepository.getUserById(4);
    expect(retrievedUser).toEqual(newUser);
  });

  it('should handle multiple user creations with incrementing IDs', async () => {
    const user1 = userRepository.createUser({
      name: 'Bob Wilson',
      email: 'bob@example.com',
    });

    const user2 = userRepository.createUser({
      name: 'Alice Wilson',
      email: 'alice@example.com',
    });

    expect(user1.id).toBe(4);
    expect(user2.id).toBe(5);

    // Verify both users were added
    const retrievedUser1 = await userRepository.getUserById(4);
    const retrievedUser2 = await userRepository.getUserById(5);

    expect(retrievedUser1).toEqual(user1);
    expect(retrievedUser2).toEqual(user2);
  });
});
