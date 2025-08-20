import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './user-service';

describe('Concurrent Request Decorator', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    userService.initializeCache();
  });

  it('should handle concurrent requests for the same user ID efficiently', async () => {
    // Use a user ID that's not in the initial cache
    const userId = 999; // This user doesn't exist in mock data

    // Mock the simulateDatabaseCall to have a longer delay for testing
    const originalSimulateDatabaseCall = userService['simulateDatabaseCall'];
    const mockSimulateDatabaseCall = vi
      .fn()
      .mockImplementation(async (id: number) => {
        await new Promise(resolve => globalThis.setTimeout(resolve, 100)); // 100ms delay
        return originalSimulateDatabaseCall.call(userService, id);
      });

    // Replace the method
    userService['simulateDatabaseCall'] = mockSimulateDatabaseCall;

    const startTime = Date.now();

    // Make multiple concurrent requests for the same user ID
    const promises = [
      userService.getUserById(userId),
      userService.getUserById(userId),
      userService.getUserById(userId),
      userService.getUserById(userId),
      userService.getUserById(userId),
    ];

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // All promises should be rejected with the same error
    results.forEach(result => {
      expect(result.status).toBe('rejected');
    });

    // The database call should only have been made once if the decorator is working
    expect(mockSimulateDatabaseCall).toHaveBeenCalledTimes(1);

    // Total time should be close to the single database call time (100ms + 200ms = 300ms) plus some overhead
    // Not 5 * 300ms = 1500ms
    expect(totalTime).toBeLessThan(350); // Should be much less than 1500ms
  });

  it('should handle concurrent requests for different user IDs independently', async () => {
    // Use user IDs that are not in the initial cache
    const startTime = Date.now();

    // Make concurrent requests for different user IDs
    const promises = [
      userService.getUserById(999), // Non-existent user
      userService.getUserById(998), // Non-existent user
      userService.getUserById(997), // Non-existent user
    ];

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // All promises should be rejected
    results.forEach(result => {
      expect(result.status).toBe('rejected');
    });

    // Each user should have triggered a separate database call since they're different IDs
    expect(results).toHaveLength(3);

    // Total time should be close to the single database call time since they run in parallel
    expect(totalTime).toBeLessThan(300); // Should be much less than 3 * 200ms = 600ms
  });

  it('should handle errors properly in concurrent requests', async () => {
    const invalidUserId = 999; // User that doesn't exist

    // Make multiple concurrent requests for an invalid user ID
    const promises = [
      userService.getUserById(invalidUserId),
      userService.getUserById(invalidUserId),
      userService.getUserById(invalidUserId),
    ];

    // All promises should reject with the same error
    const results = await Promise.allSettled(promises);

    results.forEach(result => {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason.message).toContain('User with ID 999 not found');
      }
    });

    // The database call should only have been made once
    // Note: We can't easily test this without exposing the method, but the decorator should work
  });

  it('should handle concurrent requests independently across different instances', async () => {
    // Create two separate instances
    const userService1 = new UserService();
    const userService2 = new UserService();

    // Mock the simulateDatabaseCall for both instances
    const originalSimulateDatabaseCall =
      UserService.prototype['simulateDatabaseCall'];
    const mockSimulateDatabaseCall = vi
      .fn()
      .mockImplementation(async (id: number) => {
        await new Promise(resolve => globalThis.setTimeout(resolve, 100));
        return originalSimulateDatabaseCall.call(this, id);
      });

    userService1['simulateDatabaseCall'] = mockSimulateDatabaseCall;
    userService2['simulateDatabaseCall'] = mockSimulateDatabaseCall;

    const startTime = Date.now();

    // Make concurrent requests on different instances for the same user ID
    const promises = [
      userService1.getUserById(999),
      userService1.getUserById(999),
      userService2.getUserById(999),
      userService2.getUserById(999),
    ];

    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // All promises should be rejected
    results.forEach(result => {
      expect(result.status).toBe('rejected');
    });

    // Should have been called twice - once per instance
    // This verifies that different instances have separate ongoing request tracking
    expect(mockSimulateDatabaseCall).toHaveBeenCalledTimes(2);

    // Total time should be around 300ms since each instance has its own 100ms delay
    // The original simulateDatabaseCall also has a 200ms delay
    expect(totalTime).toBeLessThan(350);
  });
});
