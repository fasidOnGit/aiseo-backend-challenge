# Users Module

This module provides user management functionality with efficient caching and concurrent request handling.

## Features

- **User Management**: Create, retrieve, and manage users
- **LRU Cache**: Efficient caching with TTL and background cleanup
- **Concurrent Request Handling**: Prevents duplicate database calls for the same user ID
- **Queue-based Database Operations**: Manages database load with PQueue

## Concurrent Request Decorator

The `@preventConcurrentRequests` decorator efficiently handles multiple simultaneous requests for the same user ID by:

- **Preventing Duplicate Calls**: If a request for a specific user ID is already in progress, subsequent requests wait for the first one to complete
- **Promise Sharing**: All concurrent requests for the same parameters share the same promise
- **Automatic Cleanup**: Completed requests are automatically removed from the tracking map
- **Parameter-based Keys**: Uses method name and parameters to create unique request keys

### Usage

```typescript
import { preventConcurrentRequests } from './concurrent-request-decorator';

export class UserService {
  @preventConcurrentRequests
  async getUserById(id: number): Promise<User> {
    // This method will only execute once per unique ID
    // Multiple concurrent calls for the same ID will share the same promise
  }
}
```

### How It Works

1. **Instance-based Storage**: Each class instance has its own ongoing requests map using a WeakMap
2. **Request Tracking**: Maintains a map of ongoing requests using method name + parameters as keys
3. **Duplicate Detection**: Checks if a request with the same parameters is already in progress
4. **Promise Sharing**: Returns the existing promise if a duplicate request is detected
5. **Automatic Cleanup**: Completed requests are automatically removed from the tracking map
6. **Memory Safety**: Uses WeakMap to prevent memory leaks when instances are garbage collected

### Benefits

- **Eliminates Database Duplicates**: Prevents multiple database calls for the same user ID
- **Improves Performance**: Reduces database load and response times
- **Maintains Consistency**: All concurrent requests receive the same result
- **Clean Architecture**: Keeps concurrent request logic separate from business logic

## Cache Management

The user cache uses an LRU (Least Recently Used) strategy with:
- Configurable TTL (Time To Live)
- Background cleanup of expired entries
- Metrics collection for monitoring
- Automatic eviction when capacity is reached

## Database Operations

Database operations are managed through a queue system to:
- Prevent overwhelming the database
- Handle timeouts gracefully
- Maintain consistent error handling
- Support concurrent operations for different user IDs

## Testing

Comprehensive tests cover:
- Concurrent request handling
- Cache behavior
- Error scenarios
- Performance characteristics

Run tests with:
```bash
npm test
```
