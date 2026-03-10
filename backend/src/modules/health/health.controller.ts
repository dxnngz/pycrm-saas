import { Router } from 'express';
import { prisma } from '../../core/prisma.js';
import { redisCache } from '../../core/redis.js';
import { logger } from '../../utils/logger.js';
import { ResilienceService } from '../../core/resilience.service.js';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System health check with Resilience Metrics
 *     description: Returns the health status and the status of the Triple Self-Healing Armor.
 */
router.get('/', async (req, res) => {
    try {
        const startTime = Date.now();

        // 1. Check Database
        await prisma.$queryRaw`SELECT 1`;
        const dbStatus = 'connected';

        // 2. Check Redis
        let redisStatus = 'disconnected';
        try {
            await redisCache.ping();
            redisStatus = 'connected';
        } catch (e) {
            logger.error({ msg: 'Redis Health Check Failed', error: e });
        }

        const duration = Date.now() - startTime;
        const resilience = ResilienceService.getMetrics();
        const cache = await redisCache.getTelemetry();

        res.json({
            status: redisStatus === 'connected' && dbStatus === 'connected' ? 'ok' : 'degraded',
            database: dbStatus,
            redis: redisStatus,
            cache,
            resilience,
            latency_ms: duration,
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0'
        });
    } catch (err: any) {
        logger.error({ msg: 'Health Check Failed', error: err.message });
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            message: 'Core service dependency failure'
        });
    }
});

export default router;
