import { Queue } from 'bullmq';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';
import { Redis } from 'ioredis';

// Reuse the native ioredis connection
const connection = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const reportQueue = new Queue('reports', { connection: connection as any });
export const emailQueue = new Queue('emails', { connection: connection as any });

export const addReportJob = async (userId: number, reportType: string) => {
    try {
        const job = await reportQueue.add('generate-report', { userId, reportType }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
            removeOnFail: false
        });
        logger.info(`Added report job ${job.id} for user ${userId}`);
        return job;
    } catch (error) {
        logger.error(error, 'Error adding report job:');
        throw error;
    }
};

export const addEmailJob = async (to: string, subject: string, html: string) => {
    try {
        const job = await emailQueue.add('send-email', { to, subject, html }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false
        });
        logger.info(`Added email job ${job.id} to ${to}`);
        return job;
    } catch (error) {
        logger.error(error, 'Error adding email job:');
        throw error;
    }
};
