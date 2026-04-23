import app from './app.js';
import { logger } from './utils/logger.js';
import { prisma } from './core/prisma.js';
import { startWorkers } from './jobs/worker.js';
import { commercialIntelligenceJob } from './jobs/commercialIntelligence.js';
import { hashPassword } from './auth.js';
import { env } from './env.js';
import { initCacheSubscriber } from './core/subscribers/cache.subscriber.js';
import { addReminderJob } from './jobs/queue.js';
import { workflowEngine } from './modules/workflows/workflow.engine.js';

import { ResilienceService } from './core/resilience.service.js';

const port = env.PORT || 3000;
// ... (lines 14-44)
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
        await prisma.$connect();
        logger.info('✅ Conexión a la base de datos PostgreSQL exitosa');

        // Elite Hardening: MigrationGuard (Pre-flight Sync Check)
        await ResilienceService.performMigrationGuard();

        // Self-healing Schema Armor (Triple Shield)
        await ResilienceService.performSchemaHealing();

        // Initialize Cache Invalidation Listeners
        initCacheSubscriber();

        // Initialize Daily Commercial Intelligence CRON
        commercialIntelligenceJob.init();

        // Initialize background tasks scheduling
        addReminderJob().catch(e => logger.warn({ err: e.message }, 'Failed to schedule daily reminders (Redis likely offline)'));

        // Initialize Workflow Engine
        logger.info('🚀 Workflow Engine Initialized');

        await ensureAdmin();

        app.listen(Number(port), '0.0.0.0', () => {
            logger.info(`🚀 Server is running on port ${port} at 0.0.0.0`);

            if (process.env.NODE_ENV !== 'test') {
                // Initialize background workers
                startWorkers();
            }
        });
    } catch (err) {
        logger.error({ msg: '❌ Error starting server', err });
        process.exit(1);
    }
};

startServer();
