// User types and interfaces
export type { User, CreateUserRequest, UserCache } from './types';

// User service
export { UserService } from './user-service';

// Singleton management
export { getUserService, initializeUserCache } from './user-cache-singleton';

// Routes
export { default as userRoutes } from './user-routes';

// Mock data
export { mockUsers, getMockUsers, getMockUserById } from './mock-data';
