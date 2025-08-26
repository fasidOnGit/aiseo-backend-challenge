# Express.js TypeScript Server with Advanced Caching & Rate Limiting

A high-performance Express.js server built with TypeScript featuring sophisticated caching strategies, distributed rate limiting, and asynchronous job processing.

## What This Repository Is About

This is a production-ready Express.js server that demonstrates advanced architectural patterns including:
- **LRU Cache with TTL**: Memory-efficient caching with automatic expiration
- **Distributed Rate Limiting**: Redis-backed rate limiting with burst traffic handling
- **Asynchronous Job Processing**: BullMQ-powered background job processing
- **Background Cleanup**: Automatic cache maintenance and memory optimization

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- Docker & Docker Compose (for Redis)

## Quick Start

1. **Start Redis:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Run the application:**
   ```bash
   # Development with hot reload
   pnpm dev
   
   # Production
   pnpm build && pnpm start
   ```

## Testing the API

1. **Run tests:**
   ```bash
   pnpm test
   pnpm test:watch
   ```

2. **Test endpoints:**
   ```bash
   # Cache status
   curl http://localhost:3000/cache-status
   
   # User operations
   curl http://localhost:3000/api/users/1
   ```

## Implementation Details

### Caching Strategy

**LRU Cache with TTL**: Implements a Least Recently Used cache with configurable time-to-live (TTL) values. Features include:
- Automatic expiration of stale entries
- Background cleanup processes
- Memory-efficient doubly-linked list implementation
- Cache metrics and monitoring endpoints

**Key Components:**
- `LRUCache`: Core caching logic with TTL support
- `CacheRegistry`: Centralized cache management and metrics
- `BackgroundCleanup`: Automated cleanup of expired entries

### Rate Limiting Implementation

**Two-Tier Rate Limiting**: Implements sophisticated rate limiting using Redis:
- **Minute Limit**: Configurable requests per minute (default: 10/min)
- **Burst Limit**: Short-window burst protection (default: 5/10s)
- **Distributed**: Works across multiple server instances
- **Configurable**: Customizable limits, durations, and block periods

**Features:**
- IP-based client identification
- Retry-After headers
- Rate limit headers for monitoring
- Graceful degradation with configurable block durations

### Asynchronous Processing

**BullMQ Integration**: Handles background job processing with:
- **Queue Management**: Dedicated queues for different operations
- **Job Uniqueness**: Prevents duplicate job execution
- **Error Handling**: Robust error handling and retry mechanisms
- **Scalability**: Horizontal scaling across multiple workers

**Use Cases:**
- User data processing
- Cache warming operations
- Background maintenance tasks

## API Endpoints

- `GET /cache-status` - Cache statistics and metrics
- `DELETE /cache-status` - Reset cache metrics
- `GET /api/users/:id` - User retrieval with caching
- `GET /health` - Health check

## Environment Variables

- `PORT` - Server port (default: 3000)
- `REDIS_URL` - Redis connection string (default: redis://localhost:6379)

## Project Structure

```
src/
├── cache/           # LRU cache implementation
├── rate-limiting/   # Rate limiting middleware
├── users/          # User management with queues
└── initializers/   # Service initialization
```

## Available Scripts

- `pnpm dev` - Development server with hot reload
- `pnpm build` - Build TypeScript
- `pnpm start` - Production server
- `pnpm test` - Run tests
- `pnpm lint` - Code linting
- `pnpm format` - Code formatting
