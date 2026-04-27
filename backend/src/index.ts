import app from './app.js';
import { logger } from './utils/logger.js';
import { prisma } from './core/prisma.js';
import { startWorkers } from './jobs/worker.js';
import { commercialIntelligenceJob } from './jobs/commercialIntelligence.js';
import { hashPassword } from './auth.js';
import { env } from './env.js';
import { initCacheSubscriber } from './core/subscribers/cache.subscriber.js';
import { addReminderJob, initQueueConnection } from './jobs/queue.js';
import { redisCache } from './core/redis.js';

import { ResilienceService } from './core/resilience.service.js';

// --- Process-level error handlers ---
// Prevent unhandled errors (e.g., from ioredis DNS failures) from crashing the process
process.on('uncaughtException', (err) => {
    logger.error({ err: err.message, stack: err.stack }, '🔥 Uncaught Exception (process kept alive)');
});
process.on('unhandledRejection', (reason: any) => {
    logger.error({ err: reason?.message || reason }, '🔥 Unhandled Rejection (process kept alive)');
});

const port = env.PORT || 3001;

const ensureAdmin = async () => {
    try {
        // Never bootstrap a default admin account in production.
        if (env.NODE_ENV === 'production') {
            logger.info('Skipping default admin bootstrap in production');
            return;
        }

        const adminEmail = 'admin@saas.com';
        const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (!adminExists) {
            logger.info(' No admin found, seeding initial data...');
            const tenant = await prisma.tenant.upsert({
                where: { id: 1 },
                update: {},
                create: { id: 1, name: 'Empresa Demo SaaS' }
            });

            const hashedPassword = await hashPassword('admin123');
            await prisma.user.create({
                data: {
                    tenant_id: tenant.id,
                    name: 'Administrador Sistema',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin'
                }
            });
            logger.info('✅ Default admin account created: admin@saas.com / admin123');
        }
    } catch (err) {
        logger.error({ msg: '❌ Failed to ensure admin existence', err });
    }
};

const startServer = async () => {
    try {
        // 1. Database connection (critical — fail if unreachable)
        await prisma.$connect();
        logger.info('✅ Conexión a la base de datos PostgreSQL exitosa');

        // 2. Start HTTP server FIRST — this makes Render's health check pass immediately
        app.listen(Number(port), '0.0.0.0', () => {
            logger.info(`🚀 Server is running on port ${port} at 0.0.0.0`);
        });

        // 3. All remaining initialization is non-blocking background work
        //    The server is already accepting requests at this point.
        setImmediate(async () => {
            try {
                // Redis connection (with DNS pre-validation — won't flood if hostname is bad)
                await redisCache.connect();

                // BullMQ queue connection (with DNS pre-validation)
                await initQueueConnection();

                // MigrationGuard
                await ResilienceService.performMigrationGuard();

                // Schema healing
                await ResilienceService.performSchemaHealing();

                // Cache invalidation listeners
                initCacheSubscriber();

                // CRON jobs
                commercialIntelligenceJob.init();

                // Background task scheduling
                addReminderJob().catch(e => logger.warn({ err: e.message }, 'Failed to schedule daily reminders'));

                // Workflow Engine
                logger.info('🚀 Workflow Engine Initialized');

                await ensureAdmin();

                // Background workers (async — uses DNS pre-validation internally)
                if (process.env.NODE_ENV !== 'test') {
                    await startWorkers();
                }

                logger.info('✅ All background services initialized.');
            } catch (initErr: any) {
                logger.error({ msg: '⚠️ Post-startup initialization warning', err: initErr?.message || initErr });
            }
        });
    } catch (err) {
        logger.error({ msg: '❌ Error starting server', err });
        process.exit(1);
    }
};

startServer();
