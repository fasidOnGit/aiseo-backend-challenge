import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { appInitializer } from './initializers';
import { initializeApp } from './initializers/app-initializer';
import { userRoutes } from './users';
import { globalRateLimitMiddleware } from './rate-limiting/rate-limiter-initializer';

const app = express();
const PORT = process.env['PORT'] || 3000;

app.use(helmet());

app.use(
  cors({
    origin: process.env['CORS_ORIGIN'] || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Apply rate limiting middleware using global instance
app.use((req, res, next) => {
  if (globalRateLimitMiddleware) {
    globalRateLimitMiddleware.middleware(req, res, next);
  } else {
    // If rate limiting is not ready yet, allow the request
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// User routes
app.use('/users', userRoutes);

app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('*', (_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await appInitializer.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await appInitializer.cleanup();
  process.exit(0);
});

// Start the application
initializeApp()
  .then(() => {
    app.listen(PORT, (): void => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  });
