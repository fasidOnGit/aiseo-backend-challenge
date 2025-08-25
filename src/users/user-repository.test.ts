import { describe, it, expect, beforeEach } from 'vitest';
import { UserRepository } from './user-repository';
import { CreateUserRequest } from './types';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  it('should populate with mock data on instantiation', () => {
    expect(userRepository.getSize()).toBe(3);

    const user1 = userRepository.getUserById(1);
    expect(user1).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('should get user by ID', () => {
    const user = userRepository.getUserById(2);
    expect(user).toEqual({
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
    });
  });

  it('should return undefined for non-existent user', () => {
    const user = userRepository.getUserById(999);
    expect(user).toBeUndefined();
  });

  it('should create new user with auto-incrementing ID', () => {
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

    expect(userRepository.getSize()).toBe(4);
  });

  it('should handle multiple user creations with incrementing IDs', () => {
    const user1 = userRepository.createUser({
      name: 'User 1',
      email: 'user1@example.com',
    });

    const user2 = userRepository.createUser({
      name: 'User 2',
      email: 'user2@example.com',
    });

    expect(user1.id).toBe(4);
    expect(user2.id).toBe(5);
    expect(userRepository.getSize()).toBe(5);
  });
});
