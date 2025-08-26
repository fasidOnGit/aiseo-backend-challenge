import { Router, Request, Response } from 'express';
import { CacheRegistry } from './cache-registry';

const router: Router = Router();

/**
 * GET /cache-status
 * Returns comprehensive cache statistics including:
 * - Overall cache metrics (total caches, size, hits, misses, hit rate)
 * - Individual cache metrics grouped by name
 * - Average response times for each cache
 */
router.get('/cache-status', (_req: Request, res: Response): void => {
  try {
    const registry = CacheRegistry.getInstance();
    const stats = registry.getStats();

    res.status(200).json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        ...stats,
      },
    });
  } catch (error) {
    console.error('Error fetching cache status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache status',
    });
  }
});

/**
 * POST /cache-status/reset
 * Resets metrics for all caches
 */
router.delete('/', (_req: Request, res: Response): void => {
  try {
    const registry = CacheRegistry.getInstance();
    registry.resetAllMetrics();

    res.status(200).json({
      success: true,
      message: 'All cache metrics have been reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resetting cache metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset cache metrics',
    });
  }
});

export { router as cacheRoutes };
