/**
 * Decorator that prevents duplicate concurrent requests for the same parameters.
 * If a request with the same parameters is already in progress, subsequent requests
 * will wait for the first one to complete instead of creating duplicate calls.
 */
const ongoingRequestsMap = new WeakMap<object, Map<string, Promise<unknown>>>();

export function preventConcurrentRequests<T extends unknown[], R>(
  _target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (this: object, ...args: T): Promise<R> {
    // Get or create the ongoing requests map for this instance
    if (!ongoingRequestsMap.has(this)) {
      ongoingRequestsMap.set(this, new Map());
    }

    const ongoingRequests = ongoingRequestsMap.get(this)!;
    const requestKey = `${propertyKey}:${JSON.stringify(args)}`;

    const ongoingRequest = ongoingRequests.get(requestKey) as Promise<R>;
    if (ongoingRequest) {
      return ongoingRequest;
    }

    const requestPromise = originalMethod.apply(this, args);
    ongoingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      ongoingRequests.delete(requestKey);
    }
  };

  return descriptor;
}
