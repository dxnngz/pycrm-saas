import { createClient } from 'redis';
import { env } from '../env.js';
import { logger } from '../utils/logger.js';
import { redisCacheHits, redisCacheMisses } from './metrics.js';
import dns from 'dns/promises';

const REDIS_URL = env.REDIS_URL;

// DNS pre-validation: resolve hostname before attempting connection
async function isRedisHostReachable(url: string): Promise<boolean> {
    try {
        const parsed = new URL(url);
        await dns.lookup(parsed.hostname);
        return true;
    } catch {
        return false;
    }
}

class RedisClient {
    private client;
    private disabled = false; // true = don't even try

    constructor() {
        // If no REDIS_URL is configured, don't create a real client
        if (!REDIS_URL) {
            logger.info('ℹ️ Redis: REDIS_URL not set. Cache disabled (PostgreSQL-only mode).');
            this.disabled = true;
            // Create a dummy client that won't connect
            this.client = createClient({ url: 'redis://localhost:6379', socket: { reconnectStrategy: false } });
            return;
        }

        this.client = createClient({ 
            url: REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 2) {
                        this.disabled = true;
                        logger.warn('⚠️ Redis: Max reconnect attempts reached. Cache disabled.');
                        return false;
                    }
                    return Math.min(retries * 500, 3000);
                },
                connectTimeout: 5000,
            }
        });

        this.client.on('error', (err) => {
            if (err.code === 'ENOTFOUND') {
                this.disabled = true;
                logger.warn({ hostname: err.hostname }, '⚠️ Redis: DNS unreachable. Cache disabled.');
            } else if (err.code === 'ECONNREFUSED') {
                logger.warn({ port: err.port }, '⚠️ Redis: Connection refused.');
            } else {
                logger.error({ err: err.message }, 'Redis Connection Error');
            }
        });

        this.client.on('ready', () => {
            this.disabled = false;
            logger.info('✅ Redis: Connection established and ready.');
        });
    }

    /**
     * Connect to Redis. Must be called explicitly after construction.
     * Performs DNS pre-validation to avoid flooding the event loop.
     */
    async connect(): Promise<void> {
        if (this.disabled || !REDIS_URL) return;

        const reachable = await isRedisHostReachable(REDIS_URL);
        if (!reachable) {
            const parsed = new URL(REDIS_URL);
            logger.error({ hostname: parsed.hostname }, '❌ Redis: Hostname does not resolve. Fix REDIS_URL in environment. Cache disabled.');
            this.disabled = true;
            return;
        }

        try {
            await this.client.connect();
        } catch (e: any) {
            this.disabled = true;
            logger.warn({ error: e.message }, '⚠️ Redis: Connection failed. Cache disabled.');
        }
    }

    private isClientReady(): boolean {
        if (this.disabled) return false;
        return this.client.isOpen && this.client.isReady;
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isClientReady()) return null;
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) as T : null;
        } catch (error) {
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        if (!this.isClientReady()) return;
        try {
            const data = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, data);
            } else {
                await this.client.set(key, data);
            }
        } catch (error) {
            logger.error({ error, key }, 'Error seteando en Redis');
        }
    }

    async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
        if (!this.isClientReady()) {
            return await fetcher();
        }

        try {
            const cachedValue = await this.client.get(key);
            if (cachedValue) {
                this.client.incr('system:cache:hits').catch(() => { });
                const entityName = key.split(':')[1] || 'unknown';
                redisCacheHits.inc({ entity: entityName });
                return JSON.parse(cachedValue) as T;
            }

            const freshData = await fetcher();
            this.client.incr('system:cache:misses').catch(() => { });
            const entityName = key.split(':')[1] || 'unknown';
            redisCacheMisses.inc({ entity: entityName });
            await this.client.setEx(key, ttlSeconds, JSON.stringify(freshData));
            return freshData;
        } catch (error) {
            logger.error({ error, key }, 'Error en caché Redis');
            return await fetcher(); // Fallback to database
        }
    }

    async invalidate(pattern: string) {
        if (!this.isClientReady()) return;
        try {
            const keys: string[] = [];
            for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 500 })) {
                if (Array.isArray(key)) {
                    keys.push(...key);
                } else {
                    keys.push(key as any);
                }
            }
            if (keys.length > 0) {
                await this.client.unlink(keys);
                logger.info({ keysCount: keys.length, pattern }, '[Redis] Unlinked keys matching pattern');
            }
        } catch (error) {
            logger.error({ error, pattern }, 'Error invalidando caché Redis');
        }
    }

    async invalidateTenantCache(tenantId: number, namespace: string) {
        const pattern = `cache:${namespace}:${tenantId}:*`;
        await this.invalidate(pattern);
    }

    async ping(): Promise<string> {
        if (!this.isClientReady()) {
            throw new Error('Redis client is not ready');
        }
        return Promise.race([
            this.client.ping(),
            new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Redis ping timeout')), 1000))
        ]);
    }

    async blacklistToken(jti: string, ttlSeconds: number) {
        if (!this.isClientReady()) return;
        await this.client.setEx(`revoked:token:${jti}`, ttlSeconds, '1');
    }

    async isTokenBlacklisted(jti: string): Promise<boolean> {
        if (!this.isClientReady()) return false;
        const exists = await this.client.exists(`revoked:token:${jti}`);
        return exists === 1;
    }

    async getTelemetry() {
        if (this.disabled) return { status: 'disabled', hits: 0, misses: 0, total: 0, hitRatio: '0%' };
        if (!this.isClientReady()) return { status: 'disconnected', hits: 0, misses: 0, total: 0, hitRatio: '0%' };
        try {
            const hits = parseInt(await this.client.get('system:cache:hits') || '0', 10);
            const misses = parseInt(await this.client.get('system:cache:misses') || '0', 10);
            const total = hits + misses;
            const hitRatio = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : '0%';

            return { status: 'healthy', hits, misses, total, hitRatio };
        } catch (e) {
            return { status: 'error', hits: 0, misses: 0, total: 0, hitRatio: '0%' };
        }
    }
}

export const redisCache = new RedisClient();
