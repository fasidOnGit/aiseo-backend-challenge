import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserQueueProcessor } from './user-queue-processor';
import { UserService } from './user-service';
import { User } from './types';

// Mock UserService
vi.mock('./user-service');
const MockedUserService = vi.mocked(UserService);

describe('UserQueueProcessor', () => {
  let userQueueProcessor: UserQueueProcessor;
  let mockUserService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserService = {
      getUserById: vi.fn(),
    } as unknown as UserService;

    MockedUserService.mockImplementation(() => mockUserService);
    userQueueProcessor = new UserQueueProcessor();
  });

  describe('processGetUserById', () => {
    it('should process getUserById job successfully', async () => {
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockJob = {
        data: { userId: 1 },
      } as any;

      vi.mocked(mockUserService.getUserById).mockResolvedValue(mockUser);

      const result = await userQueueProcessor.processGetUserById(mockJob);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw error for invalid userId', async () => {
      const mockJob = {
        data: { userId: 'invalid' },
      } as any;

      await expect(
        userQueueProcessor.processGetUserById(mockJob)
      ).rejects.toThrow('Invalid userId provided');
    });
  });

  describe('getQueueConfig', () => {
    it('should return correct queue configuration', () => {
      const config = UserQueueProcessor.getQueueConfig();

      expect(config).toEqual({
        namespace: 'users',
        queueName: 'getUserById',
        processor: expect.any(Function),
      });
    });
  });
});
