import { Queue } from 'bullmq';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';
import { Redis } from 'ioredis';
import dns from 'dns/promises';

// --- DNS Pre-validation ---
// Resolve hostname BEFORE creating a connection to prevent event loop flooding
async function validateRedisHost(url: string): Promise<boolean> {
    try {
        const parsed = new URL(url);
        await dns.lookup(parsed.hostname);
        return true;
    } catch {
        return false;
    }
}

// --- Lazy Connection Factory ---
// ioredis is created with lazyConnect: true so it does NOT auto-connect at import time.
// Error handler is attached BEFORE .connect() is called to avoid the race condition.
let _connection: Redis | null = null;
let _connectionReady = false;
let _connectionFailed = false;

function createQueueConnection(): Redis {
    if (!env.REDIS_URL) {
        throw new Error('REDIS_URL is required to create BullMQ connection');
    }

    const conn = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true, // CRITICAL: prevents auto-connect at import time
        enableOfflineQueue: false,
        connectTimeout: 5000,
        retryStrategy(times) {
            if (times > 2) return null;
            return Math.min(times * 500, 2000);
        },
        reconnectOnError(err) {
            if (err.message.startsWith('READONLY')) return true;
            return false;
        }
    });

    // Attach error handler BEFORE connecting
    conn.on('error', (err: any) => {
        if (err.code === 'ENOTFOUND') {
            _connectionFailed = true;
            logger.warn({ hostname: err.hostname }, '⚠️ BullMQ: Redis DNS unreachable. Queues inactive.');
        } else if (err.code === 'ECONNREFUSED') {
            logger.warn({ port: err.port }, '⚠️ BullMQ: Redis connection refused.');
        } else {
            logger.error({ err: err.message }, 'BullMQ ioredis Connection Error');
        }
    });

    conn.on('ready', () => {
        _connectionReady = true;
        logger.info('✅ BullMQ: Redis connection established.');
    });

    return conn;
}

function getConnection(): Redis {
    if (!env.REDIS_URL) {
        throw new Error('REDIS_URL is required to initialize BullMQ');
    }
    if (!_connection) {
        _connection = createQueueConnection();
    }
    return _connection;
}

// Initialize connection in the background (non-blocking)
export async function initQueueConnection(): Promise<void> {
    if (!env.REDIS_URL) {
        logger.warn('⚠️ BullMQ: REDIS_URL not configured. Queues will not be available.');
        _connectionFailed = true;
        return;
    }

    // Pre-validate DNS before attempting connection
    const hostValid = await validateRedisHost(env.REDIS_URL);
    if (!hostValid) {
        const parsed = new URL(env.REDIS_URL);
        logger.error({ hostname: parsed.hostname }, '❌ BullMQ: Redis hostname does not resolve. Fix REDIS_URL in environment.');
        _connectionFailed = true;
        return;
    }

    try {
        const conn = getConnection();
        await conn.connect();
    } catch (e: any) {
        _connectionFailed = true;
        logger.warn({ error: e.message }, '⚠️ BullMQ: Failed to connect to Redis. Queues inactive.');
    }
}

const defaultJobOptions = {
    attempts: 5,
    backoff: {
        type: 'exponential',
        delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
};

// Queues use the lazy connection — they won't attempt DNS until initQueueConnection() is called
const queueConnection = env.REDIS_URL ? getConnection() : null;

export const reportQueue: Queue | null = queueConnection ? new Queue('reports', {
    connection: queueConnection as any,
    defaultJobOptions
}) : null;
export const emailQueue: Queue | null = queueConnection ? new Queue('emails', {
    connection: queueConnection as any,
    defaultJobOptions
}) : null;
export const systemQueue: Queue | null = queueConnection ? new Queue('system', {
    connection: queueConnection as any,
    defaultJobOptions
}) : null;
export const automationQueue: Queue | null = queueConnection ? new Queue('automations', {
    connection: queueConnection as any,
    defaultJobOptions
}) : null;

export const isQueueReady = () => _connectionReady && !_connectionFailed;

export const addReportJob = async (userId: number, reportType: string) => {
    if (!isQueueReady() || !reportQueue) {
        logger.warn('Skipping report job: Redis not available');
        return null;
    }
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
    if (!isQueueReady() || !emailQueue) {
        logger.warn('Skipping email job: Redis not available');
        return null;
    }
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
    const queue = systemQueue;
    if (!isQueueReady() || !queue) {
        logger.warn('Skipping reminder scheduling: Redis not available');
        return;
    }
    try {
        await queue.add('task-reminders', {}, {
            repeat: { pattern: '0 9 * * *' },
            jobId: 'daily-reminders',
            removeOnComplete: true,
            removeOnFail: false
        });
        logger.info('Scheduled repeatable task reminder job (9 AM daily)');
    } catch (error) {
        logger.error(error, 'Error scheduling reminder job:');
    }
};
