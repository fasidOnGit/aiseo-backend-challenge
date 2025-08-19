# LRU Cache Implementation

This module provides a Least Recently Used (LRU) cache implementation with Time-To-Live (TTL) support and optional metrics collection.

## Features

- **TTL-Based Expiration**: Items automatically expire after a specified time
- **Unlimited Capacity**: No artificial limits on cache size
- **TypeScript Support**: Fully typed with generic support for any data type
- **Efficient Operations**: O(1) time complexity for get, set, and has operations
- **Metrics Collection**: Optional performance metrics including hits, misses, and hit rate
- **Background Cleanup**: Automatic cleanup of expired entries using worker threads and p-queue

## Usage

### Basic Cache

```typescript
import { createLRUCacheProvider } from './cache';

// Create a cache with 5 minutes TTL
const cache = createLRUCacheProvider<string>({
  ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
});

// Set a value
cache.set('key1', 'value1');

// Get a value
const value = cache.get('key1'); // Returns 'value1'

// Check if key exists
const exists = cache.has('key1'); // Returns true

// Get current cache size
const size = cache.size(); // Returns 1
```

### Cache with Metrics

```typescript
import { createMetricsLRUCache } from './cache';

// Create a metrics-enabled cache
const metricsCache = createMetricsLRUCache<string>({
  ttl: 5 * 60 * 1000,
});

// Use the cache normally
metricsCache.set('key1', 'value1');
metricsCache.get('key1'); // Hit
metricsCache.get('nonexistent'); // Miss

// Get performance metrics
const metrics = metricsCache.getMetrics();
console.log(`Hit rate: ${(metrics.hitRate * 100).toFixed(2)}%`);
console.log(`Hits: ${metrics.hits}, Misses: ${metrics.misses}`);
console.log(`Current size: ${metrics.currentSize}/${metrics.maxSize}`);

// Reset metrics if needed
metricsCache.resetMetrics();
```

### Background Cleanup Cache

```typescript
import { createAutoCleanupCache } from './cache';

// Create a cache with automatic background cleanup
const autoCleanupCache = createAutoCleanupCache<string>({
  ttl: 5 * 60 * 1000, // 5 minutes TTL
  cleanupInterval: 2000, // Every 2 seconds (optional)
  onCleanup: (cleanedCount, currentSize) => {
    console.log(`Cleaned ${cleanedCount} expired entries. Current size: ${currentSize}`);
  }
});

// Start automatic cleanup
autoCleanupCache.startCleanup();

// Use the cache normally
autoCleanupCache.cache.set('key1', 'value1');
autoCleanupCache.cache.get('key1');

// Stop cleanup when done
autoCleanupCache.stopCleanup();
```

## API

### `createLRUCacheProvider<T>(options: LRUCacheOptions): LRUProvider<T>`

Creates a new LRU cache instance.

#### Options

- `ttl`: Time-to-live for cache items in milliseconds

#### Methods

- `set(key: string, value: T)`: Sets a key-value pair in the cache
- `get(key: string): T | undefined`: Retrieves a value by key
- `has(key: string): boolean`: Checks if a key exists in the cache
- `size(): number`: Returns the current number of items in the cache

### `createMetricsLRUCache<T>(options: LRUCacheOptions): MetricsLRUWrapper<T>`

Creates a new LRU cache instance with metrics collection.

#### Additional Methods

- `getMetrics(): CacheMetrics`: Returns cache performance metrics
- `resetMetrics(): void`: Resets all metrics counters

### `createAutoCleanupCache<T>(options: LRUCacheOptions, cleanupOptions?: CleanupOptions): AutoCleanupCache<T>`

Creates a new LRU cache instance with automatic background cleanup.

#### Cleanup Options

- `intervalMs`: Cleanup interval in milliseconds (default: 2000)
- `onCleanup`: Optional callback function called after each cleanup
- `onError`: Optional callback function called when cleanup errors occur

#### Methods

- `cache`: The underlying cache instance implementing `SizableCache<T> & CleanupableCache`
- `cleanupService`: The background cleanup service
- `startCleanup(): void`: Starts automatic cleanup
- `stopCleanup(): void`: Stops automatic cleanup

### Metrics Interfaces

#### Base Metrics (from metrics collector)
```typescript
interface CacheMetrics {
  hits: number;           // Number of successful cache retrievals
  misses: number;         // Number of failed cache retrievals
  maxSize: number;        // Maximum cache capacity
  hitRate: number;        // Hit rate (hits / total requests)
  totalRequests: number;  // Total number of get/has operations
}
```

#### Wrapped Cache Metrics (includes current size)
```typescript
interface WrappedCacheMetrics extends CacheMetrics {
  currentSize: number;    // Current number of items in cache
}
```

## Architecture

The implementation uses:
- **Map**: For O(1) key-value lookups
- **TTL Tracking**: Each item stores its expiration timestamp
- **Background Cleanup Service**: Worker threads and p-queue for periodic cleanup
- **Metrics Wrapper**: Adapter pattern for collecting performance data

### Interface Hierarchy

```
LRUProvider<T> (base interface)
    ↓
SizableCache<T> (adds size() method)
    ↓
CleanupableCache (adds cleanupExpiredEntries() method)
    ↓
MetricsLRUWrapper<T> (implements SizableCache + metrics)
```

This design allows:
- Basic caches to implement only `LRUProvider<T>`
- Caches that need size information to implement `SizableCache<T>`
- Caches that need cleanup capabilities to implement `CleanupableCache`
- Metrics to be added via wrapper without modifying core cache logic
- Background cleanup to be added via factory without modifying core cache logic

## Performance

- **Time Complexity**: O(1) for all operations
- **Space Complexity**: O(n) where n is the number of cached items
- **Memory Efficient**: Automatic cleanup of expired and evicted items
- **Metrics Overhead**: Minimal performance impact with metrics collection
