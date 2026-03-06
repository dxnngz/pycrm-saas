import { Worker, Job } from 'bullmq';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';
import { Redis } from 'ioredis';
import { sendEmail } from '../core/mailer.js';

const connection = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const startWorkers = () => {
    logger.info('Starting BullMQ Workers...');

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

    return { emailWorker, reportWorker };
};
