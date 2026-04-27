import { Worker, Job } from 'bullmq';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';
import { Redis } from 'ioredis';
import { sendEmail } from '../core/mailer.js';
import dns from 'dns/promises';
import { processTaskReminders } from './taskReminders.js';

async function validateRedisHost(url: string): Promise<boolean> {
    try {
        const parsed = new URL(url);
        await dns.lookup(parsed.hostname);
        return true;
    } catch {
        return false;
    }
}

const createWorkerConnection = async (): Promise<Redis | null> => {
    if (!env.REDIS_URL) {
        logger.warn('⚠️ BullMQ Worker: REDIS_URL not defined. Workers disabled.');
        return null;
    }

    // Pre-validate DNS before creating connection
    const hostValid = await validateRedisHost(env.REDIS_URL);
    if (!hostValid) {
        const parsed = new URL(env.REDIS_URL);
        logger.error({ hostname: parsed.hostname }, '❌ BullMQ Worker: Redis hostname does not resolve. Workers disabled.');
        return null;
    }

    const connection = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true, // Don't auto-connect
        connectTimeout: 5000,
        retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 250, 2000);
        },
        reconnectOnError(err) {
            if (err.message.startsWith('READONLY')) return true;
            return false;
        }
    });

    // Attach error handler BEFORE connecting
    connection.on('error', (err: any) => {
        if (err.code === 'ENOTFOUND') {
            logger.error({ hostname: err.hostname }, '❌ BullMQ Worker: DNS Resolution Failed.');
        } else if (err.code === 'ECONNREFUSED') {
            logger.warn({ port: err.port }, '⚠️ BullMQ Worker: Connection refused.');
        } else {
            logger.error({ err: err.message }, 'BullMQ Worker Connection Error');
        }
    });

    try {
        await connection.connect();
        logger.info('✅ BullMQ Worker: Redis connection established.');
        return connection;
    } catch (e: any) {
        logger.warn({ error: e.message }, '⚠️ BullMQ Worker: Failed to connect. Workers disabled.');
        try { connection.disconnect(); } catch { /* ignore */ }
        return null;
    }
};

export const startWorkers = async () => {
    logger.info('Starting BullMQ Workers...');
    const connection = await createWorkerConnection();
    if (!connection) {
        logger.warn('⚠️ BullMQ Workers skipped: no Redis connection.');
        return null;
    }

    try {
        const systemWorker = new Worker('system', async (job: Job) => {
            if (job.name === 'task-reminders') {
                await processTaskReminders();
            }
        }, { connection: connection as any });

        systemWorker.on('completed', (job) => logger.info(`System job ${job.id} completed.`));
        systemWorker.on('failed', (job, err) => logger.error(err, `System job ${job?.id} failed.`));

        const emailWorker = new Worker('emails', async (job: Job) => {
            logger.info(`Processing email job ${job.id}...`);
            const { to, subject, html } = job.data;
            await sendEmail({ to, subject, html });
        }, { connection: connection as any });

        emailWorker.on('completed', (job) => logger.info(`Email job ${job.id} has completed!`));
        emailWorker.on('failed', (job, err) => logger.error(err, `Email job ${job?.id} has failed`));

        const reportWorker = new Worker('reports', async (job: Job) => {
            logger.info(`Processing report job ${job.id}...`);
            const { userId, reportType } = job.data;
            await new Promise(resolve => setTimeout(resolve, 5000));
            logger.info(`Report ${reportType} generated for user ${userId}`);
        }, { connection: connection as any });

        reportWorker.on('completed', (job) => logger.info(`Report job ${job.id} has completed!`));
        reportWorker.on('failed', (job, err) => logger.error(err, `Report job ${job?.id} has failed`));

        return { emailWorker, reportWorker, systemWorker };
    } catch (err: any) {
        logger.error({ err: err?.message || err }, '❌ BullMQ Worker: Init error. Continuing without workers.');
        try { connection.disconnect(); } catch { /* ignore */ }
        return null;
    }
};
