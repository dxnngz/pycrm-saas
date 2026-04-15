import { Worker, Job } from 'bullmq';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';
import { Redis } from 'ioredis';
import { sendEmail } from '../core/mailer.js';

const connection = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        if (times > 10) return null; // stop retrying
        return Math.min(times * 100, 3000);
    },
    reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.slice(0, targetError.length) === targetError) {
            return true;
        }
        return false;
    }
});

connection.on('error', (err: any) => {
    if (err.code === 'ENOTFOUND') {
        logger.error({ err }, '❌ BullMQ Worker: No se pudo resolver la dirección de Redis. Revisa la URL en Render.');
    } else {
        logger.error({ err }, 'BullMQ Worker ioredis Connection Error');
    }
});

import { processTaskReminders } from './taskReminders.js';

export const startWorkers = () => {
    logger.info('Starting BullMQ Workers...');

    // ... (rest of workers)
    const systemWorker = new Worker('system', async (job: Job) => {
        if (job.name === 'task-reminders') {
            await processTaskReminders();
        }
    }, { connection: connection as any });

    systemWorker.on('completed', (job) => logger.info(`System job ${job.id} completed.`));
    systemWorker.on('failed', (job, err) => logger.error(err, `System job ${job?.id} failed.`));

    // Existing workers
    const emailWorker = new Worker('emails', async (job: Job) => {
        logger.info(`Processing email job ${job.id}...`);
        const { to, subject, html } = job.data;
        await sendEmail({ to, subject, html });
    }, { connection: connection as any });

    emailWorker.on('completed', (job) => {
        logger.info(`Email job ${job.id} has completed!`);
    });

    emailWorker.on('failed', (job, err) => {
        logger.error(err, `Email job ${job?.id} has failed`);
    });

    const reportWorker = new Worker('reports', async (job: Job) => {
        logger.info(`Processing report job ${job.id}...`);
        const { userId, reportType } = job.data;
        // Mock heavy processing
        await new Promise(resolve => setTimeout(resolve, 5000));
        logger.info(`Report ${reportType} generated for user ${userId}`);
    }, { connection: connection as any });

    reportWorker.on('completed', (job) => {
        logger.info(`Report job ${job.id} has completed!`);
    });

    reportWorker.on('failed', (job, err) => {
        logger.error(err, `Report job ${job?.id} has failed`);
    });

    return { emailWorker, reportWorker, systemWorker };
};
