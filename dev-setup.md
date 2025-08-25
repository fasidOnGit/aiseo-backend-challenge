# Development Setup

## Quick Start

1. **Start Redis only:**
   ```bash
   docker-compose up redis
   ```

2. **Run your server locally:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

3. **Your server connects to Redis on `localhost:6379`**

## Why This Setup?

- **Simpler development** - No need to build/run API in Docker
- **Faster iteration** - Make code changes, restart server locally
- **Better debugging** - Use your IDE's debugger directly
- **Redis isolation** - Redis runs in container, your code runs locally

## Production

For production, remove Redis from docker-compose and use managed Redis services:
- AWS ElastiCache
- Azure Cache  
- GCP Memorystore
- Redis Cloud

All your containers will connect to the same managed Redis instance.
