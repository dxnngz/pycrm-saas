import { Router } from 'express';
import { prisma } from '../../core/prisma.js';
import { redisCache } from '../../core/redis.js';
import { logger } from '../../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System health check
 *     description: Returns the health status of the API and its core dependencies.
 *     responses:
 *       200:
 *         description: System is healthy
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

        res.json({
            status: redisStatus === 'connected' && dbStatus === 'connected' ? 'ok' : 'degraded',
            database: dbStatus,
            redis: redisStatus,
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
