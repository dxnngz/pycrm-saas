import { Queue } from 'bullmq';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';
import { Redis } from 'ioredis';

// Reuse the native ioredis connection
const connection = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const defaultJobOptions = {
    attempts: 5,
    backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 10s, 20s...
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
};

export const reportQueue = new Queue('reports', {
    connection: connection as any,
    defaultJobOptions
});
export const emailQueue = new Queue('emails', {
    connection: connection as any,
    defaultJobOptions
});
export const systemQueue = new Queue('system', {
    connection: connection as any,
    defaultJobOptions
});
export const automationQueue = new Queue('automations', {
    connection: connection as any,
    defaultJobOptions
});

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

export const addReminderJob = async () => {
    try {
        await systemQueue.add('task-reminders', {}, {
            repeat: { pattern: '0 9 * * *' }, // Daily at 9 AM
            jobId: 'daily-reminders', // Ensure unique
            removeOnComplete: true,
            removeOnFail: false
        });
        logger.info('Scheduled repeatable task reminder job (9 AM daily)');
    } catch (error) {
        logger.error(error, 'Error scheduling reminder job:');
    }
};
