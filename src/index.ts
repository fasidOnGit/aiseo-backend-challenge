import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { initializeUserCache, userRoutes } from './users';

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize user cache on server start
try {
  initializeUserCache();
} catch (error) {
  console.error('Failed to initialize user cache:', error);
}

// User routes
app.use('/users', userRoutes);

app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: Request, res: Response): void => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('*', (_req: Request, res: Response): void => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, (): void => {
  console.log(`Server is running on port ${PORT}`);
});
