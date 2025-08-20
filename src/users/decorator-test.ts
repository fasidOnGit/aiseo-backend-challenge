import { describe, it, expect, vi } from 'vitest';
import { preventConcurrentRequests } from './concurrent-request-decorator';

describe('Decorator Test', () => {
  it('should prevent concurrent requests', async () => {
    class TestClass {
      private callCount = 0;

      @preventConcurrentRequests
      async testMethod(id: number): Promise<string> {
        this.callCount++;
        await new Promise(resolve => globalThis.setTimeout(resolve, 100));
        return `result-${id}-${this.callCount}`;
      }
    }

    const instance = new TestClass();

    const startTime = Date.now();

    // Make multiple concurrent calls
    const promises = [
      instance.testMethod(1),
      instance.testMethod(1),
      instance.testMethod(1),
    ];

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log('Results:', results);
    console.log('Total time:', totalTime);
    console.log('Call count:', instance['callCount']);

    // All results should be the same
    expect(results[0]).toBe(results[1]);
    expect(results[1]).toBe(results[2]);

    // Should only have been called once
    expect(instance['callCount']).toBe(1);

    // Time should be close to 100ms, not 300ms
    expect(totalTime).toBeLessThan(150);
  });
});
