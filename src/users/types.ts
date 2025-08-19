/* eslint-disable no-unused-vars */
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface UserCache {
  get(id: number): User | undefined;
  set(id: number, user: User): void;
  has(id: number): boolean;
  size(): number;
  cleanupExpiredEntries(): void;
}
