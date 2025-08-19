import { UserService } from './user-service';

let userServiceInstance: UserService | null = null;

export function getUserService(): UserService {
  if (!userServiceInstance) {
    userServiceInstance = new UserService();
  }
  return userServiceInstance;
}

let isInitialized = false;

export function initializeUserCache(): void {
  if (isInitialized) {
    return;
  }

  const userService = getUserService();
  isInitialized = true;
  userService.initializeCache();
}

export function shutdownUserCache(): void {
  if (userServiceInstance) {
    userServiceInstance.stopCleanup();
    userServiceInstance = null;
  }
}

export type { UserService } from './user-service';
