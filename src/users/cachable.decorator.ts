import { createMetricsLRUCache } from '../cache';

interface CachableOptions {
  ttl?: number;
  keyPrefix?: string;
}

/**
 * Decorator that automatically caches method results
 * Each decorated method gets its own isolated cache instance
 * Cache key format: ClassName#methodName:serializedArgs
 */
export function Cachable(options: CachableOptions = {}) {
  const cache = createMetricsLRUCache({
    ttl: options.ttl || 60 * 1000, // Default 1 minute
  });

  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    // Generate cache key prefix
    const keyPrefix = options.keyPrefix || `${className}#${methodName}`;

    descriptor.value = async function (this: never, ...args: unknown[]) {
      const argsKey = args.length > 0 ? JSON.stringify(args) : 'no-args';
      const cacheKey = `${keyPrefix}:${argsKey}`;

      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== undefined) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);

      cache.set(cacheKey, result);

      return result;
    };

    return descriptor;
  };
}
