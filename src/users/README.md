# Users Module with Cache

This module implements a User entity with automatic caching and background cleanup using the LRU cache system.

## Features

- **User Management**: CRUD operations for users
- **Automatic Caching**: LRU cache with 60-second TTL
- **Background Cleanup**: Automatic cleanup every 2 seconds in separate thread
- **Metrics Collection**: Cache performance monitoring
- **Singleton Pattern**: Shared cache instance across the application
- **Mock Data**: Pre-populated with sample users

## Architecture

```
UserService
    ↓
MetricsLRUWrapper<User> (implements SizableCache + CleanupableCache)
    ↓
BackgroundCleanupService (runs every 2 seconds with p-queue)
    ↓
LRU Cache with TTL
```

## API Endpoints

### `GET /users`
Returns all users (from mock data).

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    {
      "id": 3,
      "name": "Alice Johnson",
      "email": "alice@example.com"
    }
  ]
}
```

### `GET /users/:id`
Returns a specific user by ID. If not in cache, fetches from mock data and caches it.

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### `POST /users`
Creates a new user and adds it to the cache.

**Request Body:**
```json
{
  "name": "Bob Wilson",
  "email": "bob@example.com"
}
```

**Response:**
```json
{
  "data": {
    "id": 4,
    "name": "Bob Wilson",
    "email": "bob@example.com"
  }
}
```

### `GET /users/cache/metrics`
Returns cache performance metrics.

**Response:**
```json
{
  "data": {
    "hits": 5,
    "misses": 1,
    "hitRate": 0.8333333333333334,
    "totalRequests": 6,
    "currentSize": 4
  }
}
```

## Usage

### Server Integration

The users module is automatically integrated into the Express server:

```typescript
import { userRoutes } from './users';

// User routes are automatically mounted at /users
app.use('/users', userRoutes);
```

### Cache Initialization

The cache is automatically initialized with mock data on the first user request:

```typescript
import { initializeUserCache } from './users';

// Initialize cache with mock data
await initializeUserCache();
```

### Direct Service Usage

```typescript
import { getUserService } from './users';

const userService = getUserService();

// Get user by ID
const user = await userService.getUserById(1);

// Create new user
const newUser = await userService.createUser({
  name: "New User",
  email: "new@example.com"
});

// Get cache metrics
const metrics = userService.getCacheMetrics();
```

## Cache Configuration

- **TTL**: 60 seconds
- **Cleanup Interval**: Every 2 seconds
- **Background Processing**: Main thread with p-queue for sequential tasks
- **Shared Memory**: Singleton instance accessible across the application

## Mock Data

The module comes with pre-populated mock users:

1. **John Doe** (john@example.com)
2. **Jane Smith** (jane@example.com)  
3. **Alice Johnson** (alice@example.com)

## Testing

Run the tests to verify functionality:

```bash
pnpm test
```

## Demo

Run the demo script to see the cache in action:

```bash
npx tsx src/users/demo.ts
```

## Performance

- **Cache Hits**: O(1) lookup time
- **Cache Misses**: Fetches from mock data and caches
- **Background Cleanup**: No impact on user requests
- **Memory Management**: Automatic expiration and cleanup
